import { describe, expect, test } from 'bun:test'
import { extractHtml } from './html.ts'

const PAGE = `<!doctype html>
<html lang="en"><head><title>x</title></head><body>ok</body></html>`

describe('extractHtml', () => {
  test('returns a raw document', () => {
    expect(extractHtml(PAGE)).toBe(PAGE)
  })

  test('unwraps a fenced block and ignores preamble', () => {
    const reply = `Here you go:\n\n\`\`\`html\n${PAGE}\n\`\`\`\n`
    expect(extractHtml(reply)).toBe(PAGE)
  })

  test('rejects text with no document', () => {
    expect(extractHtml('I cannot do that.')).toBeNull()
  })
})
