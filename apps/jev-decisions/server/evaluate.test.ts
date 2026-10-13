import { describe, expect, test } from 'bun:test'
import { decideEscalation, pct, priorityLevel } from '../src/lib/escalate.ts'
import { FIXTURES } from '../src/lib/fixtures.ts'
import { mockEvaluate } from './mock.ts'

describe('priorityLevel', () => {
  test('maps fractional scores onto rubric labels', () => {
    expect(priorityLevel(0.2)).toBe('Low')
    expect(priorityLevel(1.4)).toBe('Medium')
    expect(priorityLevel(2.1)).toBe('High')
    expect(priorityLevel(2.8)).toBe('Critical')
  })
})

describe('decideEscalation', () => {
  test('acts when the ticket is calm, low-priority, and confident', () => {
    const decision = decideEscalation({ urgent: 0.08, priority: 0.5, confidence: 0.82 })
    expect(decision.escalate).toBe(false)
    expect(decision.reasons.every((reason) => !reason.fired)).toBe(true)
  })

  test('escalates on urgency, high priority, or low confidence', () => {
    expect(decideEscalation({ urgent: 0.9, priority: 0.4, confidence: 0.9 }).escalate).toBe(true)
    expect(decideEscalation({ urgent: 0.1, priority: 2.2, confidence: 0.9 }).escalate).toBe(true)
    expect(decideEscalation({ urgent: 0.1, priority: 0.4, confidence: 0.3 }).escalate).toBe(true)
  })

  test('formats percents for the threshold readout', () => {
    expect(pct(0.75)).toBe('75%')
  })
})

describe('mockEvaluate', () => {
  test('classifies the billing fixture as urgent billing that escalates', () => {
    const result = mockEvaluate(FIXTURES[0].text)
    expect(result.mode).toBe('mock')
    expect(result.category.selected).toBe('billing')
    expect(result.urgent.yes).toBeGreaterThan(0.75)
    expect(result.escalation.escalate).toBe(true)
  })

  test('classifies the bug fixture as a critical prod issue', () => {
    const result = mockEvaluate(FIXTURES[1].text)
    expect(result.category.selected).toBe('bug')
    expect(result.priority.level).toBe('Critical')
    expect(result.escalation.escalate).toBe(true)
  })

  test('lets the feature request auto-act', () => {
    const result = mockEvaluate(FIXTURES[2].text)
    expect(result.category.selected).toBe('feature')
    expect(result.priority.level).toBe('Low')
    expect(result.urgent.yes).toBeLessThan(0.3)
    expect(result.escalation.escalate).toBe(false)
  })
})
