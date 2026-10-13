import { Progress } from '@/components/ui/progress'
import { pct } from '@/lib/escalate'
import type { ProbabilityBar } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProbabilityBars({
  bars,
  highlight,
}: {
  bars: ProbabilityBar[]
  highlight?: string
}) {
  return (
    <ul className="space-y-2">
      {bars.map((bar) => {
        const active = highlight === bar.key || highlight === bar.label
        return (
          <li key={bar.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn('text-foreground', active && 'font-medium')}>{bar.label}</span>
              <span className="text-muted-foreground tabular-nums">{pct(bar.value)}</span>
            </div>
            <Progress value={Math.round(bar.value * 100)} aria-label={`${bar.label} ${pct(bar.value)}`} />
          </li>
        )
      })}
    </ul>
  )
}
