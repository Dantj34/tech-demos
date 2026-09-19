import type { EvaluateResult, StatusResponse } from '@/lib/types'

export async function fetchStatus(): Promise<StatusResponse> {
  const response = await fetch('/api/status')
  const data = (await response.json()) as StatusResponse & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `Status failed (${response.status})`)
  }
  return data
}

export async function evaluateState(state: string): Promise<EvaluateResult> {
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ state }),
  })
  const data = (await response.json()) as EvaluateResult & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `Evaluate failed (${response.status})`)
  }
  return data
}
