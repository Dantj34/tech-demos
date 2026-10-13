import { ESCALATE_THRESHOLDS, QUESTION_COPY } from '../src/lib/questions.ts'
import { evaluateState, resolveMode, statusModel } from './evaluate.ts'

const PORT = Number(process.env.PORT ?? 3001)

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

const server = Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/api/health') {
      const mode = resolveMode()
      return json({ ok: true, mode })
    }

    if (req.method === 'GET' && url.pathname === '/api/status') {
      const mode = resolveMode()
      return json({
        mode,
        hasKey: mode !== 'mock',
        model: statusModel(mode),
        questions: [QUESTION_COPY.category, QUESTION_COPY.urgent, QUESTION_COPY.priority].map((question) => ({
          id: question.id,
          type: question.type,
          title: question.title,
          instructions: question.instructions,
        })),
        thresholds: { ...ESCALATE_THRESHOLDS },
      })
    }

    if (req.method === 'POST' && url.pathname === '/api/evaluate') {
      let body: { state?: unknown }
      try {
        body = (await req.json()) as { state?: unknown }
      } catch {
        return json({ error: 'Expected JSON body with a state string.' }, 400)
      }

      const state = typeof body.state === 'string' ? body.state : ''
      try {
        return json(await evaluateState(state))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return json({ error: message }, 400)
      }
    }

    return json({ error: 'Not found.' }, 404)
  },
})

console.log(`jev-decisions API http://127.0.0.1:${server.port}`)
