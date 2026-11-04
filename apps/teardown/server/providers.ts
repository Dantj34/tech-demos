import { extractHtml } from './html.ts'
import { systemPrompt } from './prompt.ts'

export type ProviderId = 'anthropic' | 'openai'

export type ProviderInfo = {
  id: ProviderId
  label: string
  model: string
}

export type ImagePayload = {
  mediaType: string
  data: string
}

export type FetchFn = typeof fetch

/** Claude Sonnet 4.5 dated snapshot (Anthropic Messages API). */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'

/**
 * Current OpenAI default for complex coding, checked 2026-11-04 against
 * https://developers.openai.com/api/docs/models/gpt-6.1-sol
 * (Responses API). Older Codex snapshots such as gpt-5-codex were retired
 * 2026-07-23; gpt-5.3-codex is deprecated. Override with OPENAI_MODEL.
 */
export const DEFAULT_OPENAI_MODEL = 'gpt-6.1-sol'

const USER_TEXT = (prompt: string) =>
  `Build a teardown-style simulator of this machine:\n\n${prompt}`

export function listProviders(env: NodeJS.Dict<string> = process.env): ProviderInfo[] {
  const providers: ProviderInfo[] = []
  if (env.ANTHROPIC_API_KEY?.trim()) {
    providers.push({
      id: 'anthropic',
      label: 'Claude',
      model: env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
    })
  }
  if (env.OPENAI_API_KEY?.trim()) {
    providers.push({
      id: 'openai',
      label: 'OpenAI',
      model: env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
    })
  }
  return providers
}

export function isProviderId(value: unknown): value is ProviderId {
  return value === 'anthropic' || value === 'openai'
}

export function resolveProvider(
  requested: unknown,
  env: NodeJS.Dict<string> = process.env,
): ProviderInfo {
  const available = listProviders(env)
  if (available.length === 0) {
    throw new GenerateError(
      'Describe a machine is off. Set ANTHROPIC_API_KEY and/or OPENAI_API_KEY on the server (never VITE_) and restart.',
      503,
    )
  }
  if (requested == null || requested === '') return available[0]!
  if (!isProviderId(requested)) {
    throw new GenerateError('Unknown provider. Use "anthropic" or "openai".', 400)
  }
  const match = available.find((provider) => provider.id === requested)
  if (!match) {
    const needed = requested === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'
    throw new GenerateError(`${requested} is not enabled. Set ${needed} (never VITE_) and restart.`, 400)
  }
  return match
}

export class GenerateError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function openaiOutputText(body: {
  output_text?: unknown
  output?: Array<{ type?: unknown; content?: Array<{ type?: unknown; text?: unknown }> }>
}): string {
  if (typeof body.output_text === 'string' && body.output_text.trim()) return body.output_text
  const parts: string[] = []
  for (const item of body.output ?? []) {
    if (item.type !== 'message') continue
    for (const block of item.content ?? []) {
      if (block.type === 'output_text' && typeof block.text === 'string') parts.push(block.text)
    }
  }
  return parts.join('\n')
}

export async function callAnthropic(
  prompt: string,
  image: ImagePayload | undefined,
  env: NodeJS.Dict<string>,
  fetchFn: FetchFn,
): Promise<string> {
  const model = env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL
  const content: Array<Record<string, unknown>> = []
  if (image) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mediaType,
        data: image.data,
      },
    })
  }
  content.push({ type: 'text', text: USER_TEXT(prompt) })

  const response = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY!.trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      system: systemPrompt(),
      messages: [{ role: 'user', content }],
    }),
  })

  const body = (await response.json()) as {
    error?: { message?: string }
    content?: Array<{ type: string; text?: string }>
  }
  if (!response.ok) {
    throw new GenerateError(body.error?.message ?? `Anthropic HTTP ${response.status}`, 502)
  }
  const text = (body.content ?? [])
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n')
  return htmlFromModel(text)
}

export async function callOpenAI(
  prompt: string,
  image: ImagePayload | undefined,
  env: NodeJS.Dict<string>,
  fetchFn: FetchFn,
): Promise<string> {
  const model = env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
  const content: Array<Record<string, unknown>> = []
  if (image) {
    content.push({
      type: 'input_image',
      image_url: `data:${image.mediaType};base64,${image.data}`,
    })
  }
  content.push({ type: 'input_text', text: USER_TEXT(prompt) })

  const response = await fetchFn('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.OPENAI_API_KEY!.trim()}`,
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 16000,
      instructions: systemPrompt(),
      input: [{ role: 'user', content }],
    }),
  })

  const body = (await response.json()) as {
    error?: { message?: string }
    output_text?: string
    output?: Array<{ type?: unknown; content?: Array<{ type?: unknown; text?: unknown }> }>
  }
  if (!response.ok) {
    throw new GenerateError(body.error?.message ?? `OpenAI HTTP ${response.status}`, 502)
  }
  return htmlFromModel(openaiOutputText(body))
}

export async function generateHtml(
  args: { provider?: unknown; prompt: string; image?: ImagePayload },
  deps: { env?: NodeJS.Dict<string>; fetch?: FetchFn } = {},
): Promise<{ html: string; title: string; provider: ProviderId; model: string }> {
  const env = deps.env ?? process.env
  const fetchFn = deps.fetch ?? fetch
  const provider = resolveProvider(args.provider, env)
  const html =
    provider.id === 'anthropic'
      ? await callAnthropic(args.prompt, args.image, env, fetchFn)
      : await callOpenAI(args.prompt, args.image, env, fetchFn)
  return { html, title: args.prompt.slice(0, 80), provider: provider.id, model: provider.model }
}

function htmlFromModel(text: string): string {
  const html = extractHtml(text)
  if (!html) throw new GenerateError('The model did not return a complete HTML page.', 502)
  return html
}
