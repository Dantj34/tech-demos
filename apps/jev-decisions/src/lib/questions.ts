import { PRIORITY_LEVELS, type CategoryKey } from './types.ts'

export const QUESTION_COPY = {
  category: {
    id: 'category' as const,
    type: 'choice' as const,
    title: 'Category',
    instructions: 'What kind of ticket is this?',
    criteria: {
      billing: 'Charges, invoices, refunds, subscriptions, or payment failures',
      bug: 'Something is broken or behaving incorrectly',
      feature: 'Asks for something that does not exist yet',
      other: 'Anything else, or not enough signal to classify',
    } satisfies Record<CategoryKey, string>,
  },
  urgent: {
    id: 'urgent' as const,
    type: 'boolean' as const,
    title: 'Urgent',
    instructions: 'Does this message convey urgency or time-sensitivity?',
    criteria: {
      true: 'Needs immediate attention, or reports an outage / blocker',
      false: 'Can wait for the normal queue',
    },
  },
  priority: {
    id: 'priority' as const,
    type: 'score' as const,
    title: 'Priority',
    instructions: 'How should this be prioritized?',
    criteria: [
      'Low — cosmetic or nice-to-have, no user impact',
      'Medium — degraded experience, workaround exists',
      'High — important user or revenue impact',
      'Critical — outage, data loss, or payment failure',
    ] as const,
    levels: PRIORITY_LEVELS,
  },
}

export const ESCALATE_THRESHOLDS = {
  urgent: 0.75,
  priority: 2,
  minConfidence: 0.5,
} as const

export function categoryLabel(key: CategoryKey): string {
  switch (key) {
    case 'billing':
      return 'Billing'
    case 'bug':
      return 'Bug'
    case 'feature':
      return 'Feature'
    case 'other':
      return 'Other'
  }
}
