import { extractHtml } from './html.ts'
import { systemPrompt } from './prompt.ts'

const PORT = Number(process.env.PORT ?? 3001)
const API_KEY = process.env.ANTHROPIC_API_KEY?.trim() ?? ''
const MODEL = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5-20250929'
const MAX_PROMPT = 4000
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

type ImagePayload = {
  mediaType: string
  data: string
}

const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function generateEnabled(): boolean {
  return API_KEY.length > 0
}

async function callClaude(prompt: string, image?: ImagePayload): Promise<string> {
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
  content.push({
    type: 'text',
    text: `Build a teardown-style simulator of this machine:\n\n${prompt}`,
  })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
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
    throw new Error(body.error?.message ?? `Anthropic HTTP ${response.status}`)
  }
  const text = (body.content ?? [])
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n')
  const html = extractHtml(text)
  if (!html) {
    throw new Error('The model did not return a complete HTML page.')
  }
  return html
}

const server = Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  idleTimeout: 255,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/api/status') {
      return json({ generateEnabled: generateEnabled(), model: generateEnabled() ? MODEL : null })
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      if (!generateEnabled()) {
        return json(
          {
            error:
              'Describe a machine is off. Set ANTHROPIC_API_KEY on the server (never VITE_) and restart.',
          },
          503,
        )
      }

      let body: { prompt?: unknown; image?: unknown }
      try {
        body = (await req.json()) as { prompt?: unknown; image?: unknown }
      } catch {
        return json({ error: 'Expected JSON with a prompt.' }, 400)
      }

      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
      if (prompt.length < 8) return json({ error: 'Describe the machine in a bit more detail.' }, 400)
      if (prompt.length > MAX_PROMPT) return json({ error: `Prompt is over ${MAX_PROMPT} characters.` }, 400)

      let image: ImagePayload | undefined
      if (body.image && typeof body.image === 'object') {
        const raw = body.image as { mediaType?: unknown; data?: unknown }
        if (typeof raw.mediaType !== 'string' || typeof raw.data !== 'string') {
          return json({ error: 'Image must include mediaType and base64 data.' }, 400)
        }
        if (!ALLOWED_IMAGE.has(raw.mediaType)) {
          return json({ error: 'Image must be jpeg, png, gif, or webp.' }, 400)
        }
        const bytes = Math.ceil((raw.data.length * 3) / 4)
        if (bytes > MAX_IMAGE_BYTES) return json({ error: 'Image is over 4 MB.' }, 400)
        image = { mediaType: raw.mediaType, data: raw.data }
      }

      try {
        const html = await callClaude(prompt, image)
        return json({ html, title: prompt.slice(0, 80) })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return json({ error: message }, 502)
      }
    }

    return json({ error: 'Not found.' }, 404)
  },
})

console.log(`teardown API http://127.0.0.1:${server.port} generate=${generateEnabled() ? 'on' : 'off'}`)
