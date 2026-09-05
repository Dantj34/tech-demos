export type GenerateResult = {
  id: string
  kind: string
  params: Record<string, number>
  label: string
  notes: string[]
  guessed: boolean
  bbox: { x: number; y: number; z: number }
  glbUrl: string
  stlUrl: string
}

export async function generatePart(prompt: string): Promise<GenerateResult> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = (await response.json()) as GenerateResult & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `Generate failed (${response.status})`)
  }
  return data
}
