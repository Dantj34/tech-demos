import { generateHtml, GenerateError, listProviders, type ImagePayload } from './providers.ts'

const PORT = Number(process.env.PORT ?? 3001)
const MAX_PROMPT = 4000
const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function parseImage(raw: unknown): ImagePayload | undefined {
  if (raw == null) return undefined
  if (typeof raw !== 'object') throw new GenerateError('Image must include mediaType and base64 data.', 400)
  const image = raw as { mediaType?: unknown; data?: unknown }
  if (typeof image.mediaType !== 'string' || typeof image.data !== 'string') {
    throw new GenerateError('Image must include mediaType and base64 data.', 400)
  }
  if (!ALLOWED_IMAGE.has(image.mediaType)) {
    throw new GenerateError('Image must be jpeg, png, gif, or webp.', 400)
  }
  const bytes = Math.ceil((image.data.length * 3) / 4)
  if (bytes > MAX_IMAGE_BYTES) throw new GenerateError('Image is over 4 MB.', 400)
  return { mediaType: image.mediaType, data: image.data }
}

const server = Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  idleTimeout: 255,
  async fetch(req) {
    const url = new URL(req.url)
    const providers = listProviders()

    if (req.method === 'GET' && url.pathname === '/api/status') {
      return json({ generateEnabled: providers.length > 0, providers })
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      let body: { prompt?: unknown; image?: unknown; provider?: unknown }
      try {
        body = (await req.json()) as { prompt?: unknown; image?: unknown; provider?: unknown }
      } catch {
        return json({ error: 'Expected JSON with a prompt.' }, 400)
      }

      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
      if (prompt.length < 8) return json({ error: 'Describe the machine in a bit more detail.' }, 400)
      if (prompt.length > MAX_PROMPT) return json({ error: `Prompt is over ${MAX_PROMPT} characters.` }, 400)

      try {
        const image = parseImage(body.image)
        const result = await generateHtml({ provider: body.provider, prompt, image })
        return json(result)
      } catch (error) {
        const status = error instanceof GenerateError ? error.status : 502
        const message = error instanceof Error ? error.message : String(error)
        return json({ error: message }, status)
      }
    }

    return json({ error: 'Not found.' }, 404)
  },
})

const names = listProviders()
  .map((provider) => `${provider.id}:${provider.model}`)
  .join(',')
console.log(
  `teardown API http://127.0.0.1:${server.port} generate=${names || 'off'}`,
)
