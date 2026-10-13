const children = [
  Bun.spawn(['bun', '--watch', 'server/index.ts'], {
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  }),
  Bun.spawn(['bunx', '--bun', 'vite'], {
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  }),
]

function shutdown() {
  for (const child of children) {
    child.kill()
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const codes = await Promise.all(children.map((child) => child.exited))
const failed = codes.find((code) => code !== 0)
process.exit(failed ?? 0)
