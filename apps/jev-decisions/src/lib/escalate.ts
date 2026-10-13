import { ESCALATE_THRESHOLDS, QUESTION_COPY } from './questions.ts'
import { PRIORITY_LEVELS, type Escalation, type PriorityLevel } from './types.ts'

export function priorityLevel(score: number): PriorityLevel {
  const clamped = Math.min(PRIORITY_LEVELS.length - 1, Math.max(0, score))
  return PRIORITY_LEVELS[Math.round(clamped)] ?? 'Low'
}

export function decideEscalation(input: {
  urgent: number
  priority: number
  confidence: number
}): Escalation {
  const urgentFired = input.urgent >= ESCALATE_THRESHOLDS.urgent
  const priorityFired = input.priority >= ESCALATE_THRESHOLDS.priority
  const confidenceFired = input.confidence < ESCALATE_THRESHOLDS.minConfidence
  const level = priorityLevel(input.priority)

  return {
    escalate: urgentFired || priorityFired || confidenceFired,
    thresholds: { ...ESCALATE_THRESHOLDS },
    reasons: [
      {
        id: 'urgent',
        label: QUESTION_COPY.urgent.title,
        fired: urgentFired,
        detail: `yes ${pct(input.urgent)} vs threshold ${pct(ESCALATE_THRESHOLDS.urgent)}`,
      },
      {
        id: 'priority',
        label: QUESTION_COPY.priority.title,
        fired: priorityFired,
        detail: `${level} ${input.priority.toFixed(2)} vs ${PRIORITY_LEVELS[ESCALATE_THRESHOLDS.priority]} ${ESCALATE_THRESHOLDS.priority.toFixed(2)}`,
      },
      {
        id: 'confidence',
        label: 'Category confidence',
        fired: confidenceFired,
        detail: `${pct(input.confidence)} vs minimum ${pct(ESCALATE_THRESHOLDS.minConfidence)}`,
      },
    ],
  }
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}
