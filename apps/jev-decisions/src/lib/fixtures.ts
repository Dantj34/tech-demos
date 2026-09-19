export type Fixture = {
  id: 'billing' | 'bug' | 'feature'
  label: string
  blurb: string
  text: string
}

export const FIXTURES: Fixture[] = [
  {
    id: 'billing',
    label: 'Billing ticket',
    blurb: 'Duplicate charge, refund today',
    text: `Subject: Charged twice for Pro plan

Hi, I was billed $49 twice for order A-104 on Friday. Please refund the duplicate charge today — our card is already over the limit and payroll hits tonight.

Thanks,
Maya`,
  },
  {
    id: 'bug',
    label: 'Bug report',
    blurb: 'Prod checkout 500',
    text: `Title: Checkout 500 after applying promo

Prod checkout started returning HTTP 500 when a promo code is applied. Repro: add any item, apply SAVE20, click pay. Started after the 14:10 deploy. Customers cannot complete purchase.

— oncall`,
  },
  {
    id: 'feature',
    label: 'Feature request',
    blurb: 'CSV invoice export',
    text: `Hey team — would be nice to export invoices as CSV for our accountant. Not urgent; we currently copy them by hand at month end. Thanks!`,
  },
]
