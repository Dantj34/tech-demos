import { existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const VENV_PYTHON = join(ROOT, '.venv', 'bin', 'python')
const REQUIREMENTS = join(ROOT, 'requirements.txt')

async function run(cmd: string[], label: string) {
  console.log(label)
  const proc = Bun.spawn(cmd, {
    cwd: ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  })
  const code = await proc.exited
  if (code !== 0) {
    throw new Error(`${cmd.join(' ')} exited ${code}`)
  }
}

async function canImportBuild123d(python: string): Promise<boolean> {
  if (!existsSync(python)) return false
  const proc = Bun.spawn([python, '-c', 'import build123d'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  return (await proc.exited) === 0
}

if (await canImportBuild123d(VENV_PYTHON)) {
  console.log('Python sidecar ready (.venv + build123d).')
  process.exit(0)
}

const systemPython = Bun.which('python3') ?? Bun.which('python')
if (!systemPython) {
  console.error('Python 3.11+ is required for the build123d sidecar.')
  process.exit(1)
}

try {
  await run([systemPython, '-m', 'venv', join(ROOT, '.venv')], 'Creating .venv …')
} catch {
  console.error(
    'Could not create a virtualenv. On Debian/Ubuntu: sudo apt install python3-venv',
  )
  process.exit(1)
}

const pip = join(ROOT, '.venv', 'bin', 'pip')
await run([pip, 'install', '--upgrade', 'pip'], 'Upgrading pip …')
await run([pip, 'install', '-r', REQUIREMENTS], 'Installing build123d (OpenCascade wheel, first run is large) …')

if (!(await canImportBuild123d(VENV_PYTHON))) {
  console.error('build123d installed but could not be imported.')
  process.exit(1)
}

console.log('Python sidecar ready.')
