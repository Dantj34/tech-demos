import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mapPrompt } from './mapper.ts'

const PORT = Number(process.env.PORT ?? 3001)
const ROOT = join(import.meta.dir, '..')
const PYTHON = join(ROOT, '.venv', 'bin', 'python')
const GENERATE_PY = join(import.meta.dir, 'generate.py')
const JOB_ROOT = join(tmpdir(), 'text-to-cad-jobs')

type Job = {
  id: string
  prompt: string
  mapped: ReturnType<typeof mapPrompt>
  bbox: { x: number; y: number; z: number }
}

const jobs = new Map<string, Job>()

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

type MeshResult = {
  stl: string
  glb: string
  bbox: { x: number; y: number; z: number }
  error?: string
}

class PythonSidecar {
  private proc: Bun.Subprocess<'pipe', 'pipe', 'pipe'> | null = null
  private buffer = ''
  private waiters: Array<(line: string) => void> = []
  private chain: Promise<unknown> = Promise.resolve()

  private start() {
    const proc = Bun.spawn([PYTHON, GENERATE_PY, '--loop'], {
      cwd: ROOT,
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    })
    this.proc = proc
    void this.readLoop(proc)
  }

  private async readLoop(proc: Bun.Subprocess<'pipe', 'pipe', 'pipe'>) {
    const reader = proc.stdout.getReader()
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        this.buffer += decoder.decode(value, { stream: true })
        let newline = this.buffer.indexOf('\n')
        while (newline !== -1) {
          const line = this.buffer.slice(0, newline)
          this.buffer = this.buffer.slice(newline + 1)
          const waiter = this.waiters.shift()
          if (waiter) waiter(line)
          newline = this.buffer.indexOf('\n')
        }
      }
    } finally {
      this.proc = null
    }
  }

  async generate(mapped: ReturnType<typeof mapPrompt>, outDir: string): Promise<MeshResult> {
    const run = this.chain.then(() => this.generateUnlocked(mapped, outDir))
    this.chain = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  private async generateUnlocked(
    mapped: ReturnType<typeof mapPrompt>,
    outDir: string,
  ): Promise<MeshResult> {
    if (!this.proc) this.start()
    const proc = this.proc
    if (!proc) throw new Error('Python sidecar failed to start.')

    const line = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timed out waiting for build123d.'))
      }, 30_000)
      this.waiters.push((text) => {
        clearTimeout(timer)
        resolve(text)
      })
      proc.stdin.write(
        `${JSON.stringify({
          kind: mapped.kind,
          params: mapped.params,
          out_dir: outDir,
        })}\n`,
      )
    })

    const parsed = JSON.parse(line) as MeshResult
    if (parsed.error) throw new Error(parsed.error)
    return parsed
  }
}

const sidecar = new PythonSidecar()

async function generateMesh(mapped: ReturnType<typeof mapPrompt>, outDir: string) {
  await mkdir(outDir, { recursive: true })
  return sidecar.generate(mapped, outDir)
}

const server = Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/api/health') {
      const probe = Bun.spawn([PYTHON, '-c', 'import build123d; print(build123d.__version__)'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })
      const [out, err, code] = await Promise.all([
        new Response(probe.stdout).text(),
        new Response(probe.stderr).text(),
        probe.exited,
      ])
      return json({
        ok: code === 0,
        build123d: out.trim() || null,
        error: code === 0 ? null : err.trim(),
      })
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      let body: { prompt?: string }
      try {
        body = (await req.json()) as { prompt?: string }
      } catch {
        return json({ error: 'Expected JSON body with a prompt.' }, 400)
      }

      const prompt = typeof body.prompt === 'string' ? body.prompt : ''
      const mapped = mapPrompt(prompt)
      const id = crypto.randomUUID()
      const outDir = join(JOB_ROOT, id)

      try {
        const result = await generateMesh(mapped, outDir)
        const job: Job = {
          id,
          prompt,
          mapped,
          bbox: result.bbox,
        }
        jobs.set(id, job)
        return json({
          id,
          kind: mapped.kind,
          params: mapped.params,
          label: mapped.label,
          notes: mapped.notes,
          guessed: mapped.guessed,
          bbox: result.bbox,
          glbUrl: `/api/models/${id}/model.glb`,
          stlUrl: `/api/models/${id}/model.stl`,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return json({ error: message }, 500)
      }
    }

    const fileMatch = url.pathname.match(/^\/api\/models\/([^/]+)\/(model\.(glb|stl))$/)
    if (req.method === 'GET' && fileMatch) {
      const id = fileMatch[1]
      const filename = fileMatch[2]
      const job = jobs.get(id)
      if (!job) return json({ error: 'Unknown model id.' }, 404)
      const file = Bun.file(join(JOB_ROOT, id, filename))
      if (!(await file.exists())) return json({ error: 'File missing.' }, 404)
      const type = filename.endsWith('.glb') ? 'model/gltf-binary' : 'model/stl'
      return new Response(file, {
        headers: {
          'content-type': type,
          'content-disposition': `attachment; filename="${job.mapped.kind}-${id.slice(0, 8)}.${filename.split('.').pop()}"`,
          'cache-control': 'no-store',
        },
      })
    }

    return json({ error: 'Not found.' }, 404)
  },
})

console.log(`text-to-cad API http://127.0.0.1:${server.port}`)
