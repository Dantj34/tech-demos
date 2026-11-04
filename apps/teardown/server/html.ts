/** Pull a complete HTML document out of a model reply (raw or fenced). */
export function extractHtml(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const fenced = trimmed.match(/```(?:html)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? trimmed).trim()
  const start = candidate.search(/<!doctype\s+html|<html[\s>]/i)
  if (start === -1) return null
  const html = candidate.slice(start).trim()
  if (!html.toLowerCase().includes('</html>')) return null
  return html
}
