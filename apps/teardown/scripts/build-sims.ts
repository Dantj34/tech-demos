import { mkdir, cp } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const VENDOR = join(ROOT, 'vendor', 'teardown')
const OUT = join(ROOT, '.teardown-out')
const DEST = join(ROOT, 'public', 'sims')
const NAMES = ['v8-live', 'cessna-live', 'strandbeest-live'] as const

await mkdir(DEST, { recursive: true })

const proc = Bun.spawn(['bun', join(VENDOR, 'sims', 'build.mjs'), ...NAMES], {
  cwd: ROOT,
  stdout: 'inherit',
  stderr: 'inherit',
  env: {
    ...process.env,
    TEARDOWN_DEPS: join(ROOT, 'node_modules'),
    TEARDOWN_OUT: OUT,
  },
})

const code = await proc.exited
if (code !== 0) {
  throw new Error(`sim build failed with exit ${code}`)
}

for (const name of NAMES) {
  await cp(join(OUT, 'dist', `${name}.html`), join(DEST, `${name}.html`))
}

console.log(`copied ${NAMES.length} sims → public/sims/`)
