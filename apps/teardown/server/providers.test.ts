import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_OPENAI_MODEL,
  generateHtml,
  GenerateError,
  listProviders,
  openaiOutputText,
  resolveProvider,
  type FetchFn,
} from './providers.ts'

const PAGE = `<!doctype html>
<html lang="en"><head><title>sim</title></head><body>ok</body></html>`

const FENCED = `Sure.\n\n\`\`\`html\n${PAGE}\n\`\`\`\n`

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('listProviders', () => {
  test('returns none when no keys are set', () => {
    expect(listProviders({})).toEqual([])
  })

  test('enables Claude when ANTHROPIC_API_KEY is set', () => {
    expect(listProviders({ ANTHROPIC_API_KEY: 'sk-ant-test' })).toEqual([
      { id: 'anthropic', label: 'Claude', model: 'claude-sonnet-4-5-20250929' },
    ])
  })

  test('enables OpenAI when OPENAI_API_KEY is set, honoring OPENAI_MODEL', () => {
    expect(
      listProviders({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-6-astra' }),
    ).toEqual([{ id: 'openai', label: 'OpenAI', model: 'gpt-6-astra' }])
  })

  test('lists both when both keys are set', () => {
    const providers = listProviders({
      ANTHROPIC_API_KEY: 'sk-ant-test',
      OPENAI_API_KEY: 'sk-test',
    })
    expect(providers.map((provider) => provider.id)).toEqual(['anthropic', 'openai'])
    expect(providers[1]?.model).toBe(DEFAULT_OPENAI_MODEL)
  })
})

describe('resolveProvider', () => {
  const both = { ANTHROPIC_API_KEY: 'sk-ant-test', OPENAI_API_KEY: 'sk-test' }

  test('defaults to the first available provider', () => {
    expect(resolveProvider(undefined, both).id).toBe('anthropic')
    expect(resolveProvider(undefined, { OPENAI_API_KEY: 'sk-test' }).id).toBe('openai')
  })

  test('selects openai when requested', () => {
    expect(resolveProvider('openai', both).id).toBe('openai')
  })

  test('rejects a provider whose key is missing', () => {
    expect(() => resolveProvider('openai', { ANTHROPIC_API_KEY: 'sk-ant-test' })).toThrow(GenerateError)
  })

  test('503 when neither key is set', () => {
    try {
      resolveProvider('anthropic', {})
      throw new Error('expected GenerateError')
    } catch (error) {
      expect(error).toBeInstanceOf(GenerateError)
      expect((error as GenerateError).status).toBe(503)
    }
  })
})

describe('openaiOutputText', () => {
  test('prefers output_text then walks output messages', () => {
    expect(openaiOutputText({ output_text: PAGE })).toBe(PAGE)
    expect(
      openaiOutputText({
        output: [
          { type: 'reasoning', content: [{ type: 'output_text', text: 'skip' }] },
          { type: 'message', content: [{ type: 'output_text', text: PAGE }] },
        ],
      }),
    ).toBe(PAGE)
  })
})

describe('generateHtml provider switch', () => {
  test('routes anthropic to Messages API and extracts fenced HTML', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = []
    const fetchFn: FetchFn = (async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) as Record<string, unknown> })
      return jsonResponse(200, { content: [{ type: 'text', text: FENCED }] })
    }) as FetchFn

    const result = await generateHtml(
      { provider: 'anthropic', prompt: 'a 4-stroke motorcycle engine I can take apart' },
      { env: { ANTHROPIC_API_KEY: 'sk-ant-test', OPENAI_API_KEY: 'sk-test' }, fetch: fetchFn },
    )

    expect(calls[0]?.url).toBe('https://api.anthropic.com/v1/messages')
    expect(calls[0]?.body.model).toBe('claude-sonnet-4-5-20250929')
    expect(calls[0]?.body.system).toEqual(expect.stringContaining('Upstream skill'))
    expect(result).toEqual({
      html: PAGE,
      title: 'a 4-stroke motorcycle engine I can take apart',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    })
  })

  test('routes openai to Responses API with instructions + input', async () => {
    const calls: Array<{ url: string; headers: Headers; body: Record<string, unknown> }> = []
    const fetchFn: FetchFn = (async (url, init) => {
      calls.push({
        url: String(url),
        headers: new Headers(init?.headers),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      })
      return jsonResponse(200, {
        output: [{ type: 'message', content: [{ type: 'output_text', text: PAGE }] }],
      })
    }) as FetchFn

    const result = await generateHtml(
      { provider: 'openai', prompt: 'a hydraulic excavator arm with one boom cylinder' },
      {
        env: {
          ANTHROPIC_API_KEY: 'sk-ant-test',
          OPENAI_API_KEY: 'sk-test',
          OPENAI_MODEL: 'gpt-6.1-sol',
        },
        fetch: fetchFn,
      },
    )

    expect(calls[0]?.url).toBe('https://api.openai.com/v1/responses')
    expect(calls[0]?.headers.get('authorization')).toBe('Bearer sk-test')
    expect(calls[0]?.body.model).toBe('gpt-6.1-sol')
    expect(calls[0]?.body.instructions).toEqual(expect.stringContaining('elvarofficial/teardown'))
    expect(calls[0]?.body.input).toEqual([
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: expect.stringContaining('hydraulic excavator arm'),
          },
        ],
      },
    ])
    expect(result.provider).toBe('openai')
    expect(result.html).toBe(PAGE)
  })

  test('does not send the unused provider a request', async () => {
    const urls: string[] = []
    const fetchFn: FetchFn = (async (url) => {
      urls.push(String(url))
      return jsonResponse(200, {
        output_text: PAGE,
      })
    }) as FetchFn

    await generateHtml(
      { provider: 'openai', prompt: 'Theo Jansen 11-bar walking linkage one leg' },
      { env: { ANTHROPIC_API_KEY: 'sk-ant-test', OPENAI_API_KEY: 'sk-test' }, fetch: fetchFn },
    )
    expect(urls).toEqual(['https://api.openai.com/v1/responses'])
  })
})
