export type ProviderId = 'anthropic' | 'openai'

export type ProviderInfo = {
  id: ProviderId
  label: string
  model: string
}

export type Status = {
  generateEnabled: boolean
  providers: ProviderInfo[]
}

export type GenerateResult = {
  html: string
  title: string
  provider: ProviderId
  model: string
}

export async function fetchStatus(): Promise<Status> {
  const response = await fetch('/api/status')
  if (!response.ok) {
    return { generateEnabled: false, providers: [] }
  }
  return (await response.json()) as Status
}

export async function generateMachine(
  prompt: string,
  image?: { mediaType: string; data: string },
  provider?: ProviderId,
): Promise<GenerateResult> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt, image, provider }),
  })
  const data = (await response.json()) as GenerateResult & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `Generate failed (${response.status})`)
  }
  return data
}

export function fileToImagePayload(file: File): Promise<{ mediaType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const comma = result.indexOf(',')
      const data = comma >= 0 ? result.slice(comma + 1) : result
      resolve({ mediaType: file.type || 'image/png', data })
    }
    reader.readAsDataURL(file)
  })
}
