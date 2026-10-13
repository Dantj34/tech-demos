import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk'
import { decideEscalation, priorityLevel } from '../src/lib/escalate.ts'
import { categoryLabel, QUESTION_COPY } from '../src/lib/questions.ts'
import {
  CATEGORY_KEYS,
  PRIORITY_LEVELS,
  type CategoryKey,
  type EvaluateMode,
  type EvaluateResult,
  type ProbabilityBar,
} from '../src/lib/types.ts'
import { assembleResult, mockEvaluate } from './mock.ts'

export function resolveMode(): EvaluateMode {
  if (readEnv('TYPESAFE_API_KEY')) return 'typesafe'
  if (readEnv('AI_GATEWAY_API_KEY') || readEnv('VERCEL_AI_GATEWAY_API_KEY')) return 'gateway'
  return 'mock'
}

export function statusModel(mode: EvaluateMode): string {
  if (mode === 'typesafe') return 'jev-latest'
  if (mode === 'gateway') return 'typesafe-ai/jev'
  return 'fixture / heuristic'
}

export async function evaluateState(state: string): Promise<EvaluateResult> {
  const trimmed = state.trim()
  if (!trimmed) {
    throw new Error('Paste some text to evaluate.')
  }

  const mode = resolveMode()
  if (mode === 'mock') {
    return mockEvaluate(trimmed)
  }

  try {
    if (mode === 'typesafe') {
      return await evaluateWithTypeSafe(trimmed)
    }
    return await evaluateWithGateway(trimmed)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${mode} evaluate failed: ${message}`)
  }
}

async function evaluateWithTypeSafe(state: string): Promise<EvaluateResult> {
  const client = new TypeSafeClient({
    apiKey: readEnv('TYPESAFE_API_KEY'),
  })

  const { answers, model } = await client.systemOne({
    state: { document: state },
    questions: {
      category: choice(QUESTION_COPY.category.instructions, QUESTION_COPY.category.criteria),
      urgent: noul(QUESTION_COPY.urgent.instructions, QUESTION_COPY.urgent.criteria),
      priority: score(QUESTION_COPY.priority.instructions, QUESTION_COPY.priority.criteria),
    },
  })

  const categoryProbs = CATEGORY_KEYS.map((key) => ({
    key,
    label: categoryLabel(key),
    value: numberOrZero(answers.category.probabilities[key]),
  }))
  const selected = isCategory(answers.category.choice) ? answers.category.choice : maxBar(categoryProbs)

  const priorityProbs = scoreBars(answers.priority.probabilities)
  const scoreValue = Number(answers.priority.score)

  return {
    mode: 'typesafe',
    model,
    category: {
      type: 'choice',
      id: 'category',
      title: QUESTION_COPY.category.title,
      instructions: QUESTION_COPY.category.instructions,
      selected,
      selectedLabel: categoryLabel(selected),
      confidence: Number(answers.category.confidence),
      probabilities: categoryProbs,
    },
    urgent: {
      type: 'boolean',
      id: 'urgent',
      title: QUESTION_COPY.urgent.title,
      instructions: QUESTION_COPY.urgent.instructions,
      yes: Number(answers.urgent.noul),
    },
    priority: {
      type: 'score',
      id: 'priority',
      title: QUESTION_COPY.priority.title,
      instructions: QUESTION_COPY.priority.instructions,
      score: scoreValue,
      max: PRIORITY_LEVELS.length - 1,
      level: priorityLevel(scoreValue),
      confidence: Number(answers.priority.confidence),
      legend: [...QUESTION_COPY.priority.criteria],
      probabilities: priorityProbs,
    },
    escalation: decideEscalation({
      urgent: Number(answers.urgent.noul),
      priority: scoreValue,
      confidence: Number(answers.category.confidence),
    }),
  }
}

async function evaluateWithGateway(state: string): Promise<EvaluateResult> {
  const ai = await import('ai')
  const gateway = ai.gateway as { evaluationModel?: (id: string) => unknown }
  if (typeof gateway?.evaluationModel !== 'function') {
    throw new Error(
      'This AI SDK build does not expose gateway.evaluationModel. Set TYPESAFE_API_KEY or use fixture mode.',
    )
  }

  const result = await ai.experimental_evaluate({
    model: gateway.evaluationModel('typesafe-ai/jev') as never,
    state: { document: state },
    questions: {
      category: {
        type: 'choice',
        instructions: QUESTION_COPY.category.instructions,
        criteria: QUESTION_COPY.category.criteria,
      },
      urgent: {
        type: 'boolean',
        instructions: QUESTION_COPY.urgent.instructions,
        criteria: QUESTION_COPY.urgent.criteria,
      },
      priority: {
        type: 'score',
        instructions: QUESTION_COPY.priority.instructions,
        criteria: [...QUESTION_COPY.priority.criteria],
      },
    },
  })

  const categoryAnswer = result.answers.category
  const urgentAnswer = result.answers.urgent
  const priorityAnswer = result.answers.priority
  const confidence =
    (result.providerMetadata as { typesafe?: { confidence?: Record<string, number> } } | undefined)
      ?.typesafe?.confidence ?? {}

  const categoryProbs = CATEGORY_KEYS.map((key) => ({
    key,
    label: categoryLabel(key),
    value: numberOrZero(categoryAnswer.probabilities?.[key]),
  }))
  const scoreValue = Number(priorityAnswer.score)

  return assembleResult(
    {
      category: {
        billing: numberOrZero(categoryAnswer.probabilities?.billing),
        bug: numberOrZero(categoryAnswer.probabilities?.bug),
        feature: numberOrZero(categoryAnswer.probabilities?.feature),
        other: numberOrZero(categoryAnswer.probabilities?.other),
      },
      confidence: numberOrZero(confidence.category) || peakedConfidence(categoryProbs),
      urgent: Number(urgentAnswer.probability),
      priority: {
        Low: numberOrZero(priorityAnswer.probabilities?.['0']),
        Medium: numberOrZero(priorityAnswer.probabilities?.['1']),
        High: numberOrZero(priorityAnswer.probabilities?.['2']),
        Critical: numberOrZero(priorityAnswer.probabilities?.['3']),
      },
      score: scoreValue,
      priorityConfidence: numberOrZero(confidence.priority) || peakedConfidence(scoreBars(priorityAnswer.probabilities)),
    },
    'gateway',
    result.response.modelId || 'typesafe-ai/jev',
  )
}

function scoreBars(probabilities: Record<string, number> | undefined): ProbabilityBar[] {
  return PRIORITY_LEVELS.map((label, index) => ({
    key: String(index),
    label,
    value: numberOrZero(probabilities?.[String(index)] ?? probabilities?.[index]),
  }))
}

function peakedConfidence(bars: ProbabilityBar[]): number {
  const max = Math.max(0, ...bars.map((bar) => bar.value))
  return clamp01((max - 1 / Math.max(bars.length, 1)) / (1 - 1 / Math.max(bars.length, 1)))
}

function maxBar(bars: ProbabilityBar[]): CategoryKey {
  const winner = bars.reduce((best, bar) => (bar.value > best.value ? bar : best), bars[0])
  return isCategory(winner?.key) ? winner.key : 'other'
}

function isCategory(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value)
}

function numberOrZero(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}
