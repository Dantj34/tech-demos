export const CATEGORY_KEYS = ['billing', 'bug', 'feature', 'other'] as const
export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number]

export type EvaluateMode = 'typesafe' | 'gateway' | 'mock'

export type ProbabilityBar = {
  key: string
  label: string
  value: number
}

export type ChoiceDecision = {
  type: 'choice'
  id: 'category'
  title: string
  instructions: string
  selected: CategoryKey
  selectedLabel: string
  confidence: number
  probabilities: ProbabilityBar[]
}

export type BooleanDecision = {
  type: 'boolean'
  id: 'urgent'
  title: string
  instructions: string
  yes: number
}

export type ScoreDecision = {
  type: 'score'
  id: 'priority'
  title: string
  instructions: string
  score: number
  max: number
  level: PriorityLevel
  confidence: number
  legend: string[]
  probabilities: ProbabilityBar[]
}

export type EscalationReason = {
  id: 'urgent' | 'priority' | 'confidence'
  label: string
  fired: boolean
  detail: string
}

export type Escalation = {
  escalate: boolean
  reasons: EscalationReason[]
  thresholds: {
    urgent: number
    priority: number
    minConfidence: number
  }
}

export type EvaluateResult = {
  mode: EvaluateMode
  model: string
  category: ChoiceDecision
  urgent: BooleanDecision
  priority: ScoreDecision
  escalation: Escalation
}

export type StatusResponse = {
  mode: EvaluateMode
  hasKey: boolean
  model: string
  questions: Array<{
    id: 'category' | 'urgent' | 'priority'
    type: 'choice' | 'boolean' | 'score'
    title: string
    instructions: string
  }>
  thresholds: Escalation['thresholds']
}

export type EvaluateError = {
  error: string
}
