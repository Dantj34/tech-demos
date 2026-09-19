import { decideEscalation, priorityLevel } from '../src/lib/escalate.ts'
import { FIXTURES } from '../src/lib/fixtures.ts'
import { categoryLabel, QUESTION_COPY } from '../src/lib/questions.ts'
import {
  CATEGORY_KEYS,
  PRIORITY_LEVELS,
  type CategoryKey,
  type ChoiceDecision,
  type EvaluateResult,
  type ProbabilityBar,
  type ScoreDecision,
} from '../src/lib/types.ts'

type MockAnswers = {
  category: Record<CategoryKey, number>
  confidence: number
  urgent: number
  priority: Record<(typeof PRIORITY_LEVELS)[number], number>
  score: number
  priorityConfidence: number
}

const FIXTURE_ANSWERS: Record<(typeof FIXTURES)[number]['id'], MockAnswers> = {
  billing: {
    category: { billing: 0.91, bug: 0.04, feature: 0.01, other: 0.04 },
    confidence: 0.88,
    urgent: 0.86,
    priority: { Low: 0.02, Medium: 0.12, High: 0.55, Critical: 0.31 },
    score: 2.15,
    priorityConfidence: 0.72,
  },
  bug: {
    category: { billing: 0.02, bug: 0.93, feature: 0.01, other: 0.04 },
    confidence: 0.9,
    urgent: 0.94,
    priority: { Low: 0.01, Medium: 0.06, High: 0.28, Critical: 0.65 },
    score: 2.57,
    priorityConfidence: 0.78,
  },
  feature: {
    category: { billing: 0.03, bug: 0.04, feature: 0.88, other: 0.05 },
    confidence: 0.82,
    urgent: 0.08,
    priority: { Low: 0.62, Medium: 0.28, High: 0.08, Critical: 0.02 },
    score: 0.38,
    priorityConfidence: 0.7,
  },
}

const CATEGORY_HINTS: Record<CategoryKey, string[]> = {
  billing: ['charge', 'charged', 'invoice', 'refund', 'billed', 'payment', 'subscription', 'receipt', 'card'],
  bug: ['bug', 'crash', 'error', 'broken', 'fail', 'exception', '500', 'repro', 'outage'],
  feature: ['feature', 'would be nice', 'add support', 'wishlist', 'could we', 'export', 'accountant'],
  other: [],
}

const URGENT_HINTS = ['asap', 'today', 'tonight', 'urgent', 'immediately', 'cannot', "can't", 'outage', 'down', 'prod', 'payroll']

export function mockEvaluate(state: string): EvaluateResult {
  const fixture = FIXTURES.find((item) => item.text === state)
  const answers = fixture ? FIXTURE_ANSWERS[fixture.id] : heuristicAnswers(state)
  return assembleResult(answers, 'mock', 'fixture / heuristic')
}

export function assembleResult(
  answers: MockAnswers,
  mode: EvaluateResult['mode'],
  model: string,
): EvaluateResult {
  const selected = maxKey(answers.category)
  const category: ChoiceDecision = {
    type: 'choice',
    id: 'category',
    title: QUESTION_COPY.category.title,
    instructions: QUESTION_COPY.category.instructions,
    selected,
    selectedLabel: categoryLabel(selected),
    confidence: answers.confidence,
    probabilities: CATEGORY_KEYS.map((key) => ({
      key,
      label: categoryLabel(key),
      value: answers.category[key],
    })),
  }

  const priorityBars: ProbabilityBar[] = PRIORITY_LEVELS.map((level, index) => ({
    key: String(index),
    label: level,
    value: answers.priority[level],
  }))

  const priority: ScoreDecision = {
    type: 'score',
    id: 'priority',
    title: QUESTION_COPY.priority.title,
    instructions: QUESTION_COPY.priority.instructions,
    score: answers.score,
    max: PRIORITY_LEVELS.length - 1,
    level: priorityLevel(answers.score),
    confidence: answers.priorityConfidence,
    legend: [...QUESTION_COPY.priority.criteria],
    probabilities: priorityBars,
  }

  return {
    mode,
    model,
    category,
    urgent: {
      type: 'boolean',
      id: 'urgent',
      title: QUESTION_COPY.urgent.title,
      instructions: QUESTION_COPY.urgent.instructions,
      yes: answers.urgent,
    },
    priority,
    escalation: decideEscalation({
      urgent: answers.urgent,
      priority: answers.score,
      confidence: answers.confidence,
    }),
  }
}

function heuristicAnswers(state: string): MockAnswers {
  const text = state.toLowerCase()
  const raw = {
    billing: hits(text, CATEGORY_HINTS.billing),
    bug: hits(text, CATEGORY_HINTS.bug),
    feature: hits(text, CATEGORY_HINTS.feature),
    other: 0.35,
  }
  const category = normalize(raw)
  const selected = maxKey(category)
  const urgentHits = hits(text, URGENT_HINTS)
  const urgent = clamp01(0.12 + urgentHits * 0.22 + (selected === 'bug' ? 0.18 : 0))
  const score = clamp(urgent * 2.4 + category.bug * 1.1 + category.billing * 0.8, 0, 3)
  const priority = scoreToBars(score)
  const peaked = Math.max(...Object.values(category))
  return {
    category,
    confidence: clamp01((peaked - 0.25) / 0.75),
    urgent,
    priority,
    score,
    priorityConfidence: clamp01(0.45 + Math.abs(score - Math.round(score)) * -0.4 + 0.2),
  }
}

function hits(text: string, needles: string[]): number {
  return needles.reduce((count, needle) => count + (text.includes(needle) ? 1 : 0), 0)
}

function normalize(raw: Record<CategoryKey, number>): Record<CategoryKey, number> {
  const total = CATEGORY_KEYS.reduce((sum, key) => sum + raw[key], 0) || 1
  return {
    billing: raw.billing / total,
    bug: raw.bug / total,
    feature: raw.feature / total,
    other: raw.other / total,
  }
}

function scoreToBars(score: number): Record<(typeof PRIORITY_LEVELS)[number], number> {
  const weights = PRIORITY_LEVELS.map((_, index) => Math.exp(-((score - index) ** 2) / 0.45))
  const total = weights.reduce((sum, value) => sum + value, 0)
  return {
    Low: weights[0] / total,
    Medium: weights[1] / total,
    High: weights[2] / total,
    Critical: weights[3] / total,
  }
}

function maxKey(values: Record<CategoryKey, number>): CategoryKey {
  return CATEGORY_KEYS.reduce((best, key) => (values[key] > values[best] ? key : best), CATEGORY_KEYS[0])
}

function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
