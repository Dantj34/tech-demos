import { KeyIcon, LightningIcon, PlayIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { ProbabilityBars } from '@/components/probability-bars'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { evaluateState, fetchStatus } from '@/lib/api'
import { pct } from '@/lib/escalate'
import { FIXTURES } from '@/lib/fixtures'
import type { EvaluateResult, StatusResponse } from '@/lib/types'

export default function App() {
  const [state, setState] = useState(FIXTURES[0].text)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EvaluateResult | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchStatus()
      .then((next) => {
        if (!cancelled) setStatus(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatusError(err instanceof Error ? err.message : String(err))
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onEvaluate() {
    setBusy(true)
    setError(null)
    try {
      setResult(await evaluateState(state))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const mode = result?.mode ?? status?.mode ?? 'mock'
  const fixtureId = FIXTURES.find((fixture) => fixture.text === state)?.id

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl tracking-tight">jev-decisions</h1>
              <Badge variant="outline">Jev / System One</Badge>
              <ModeBadge mode={mode} />
            </div>
            <p className="max-w-2xl text-xs text-muted-foreground">
              Paste unstructured text. Jev returns typed probabilistic decisions — category, urgency, and
              priority — plus an act-vs-escalate readout. Inspired by{' '}
              <a
                className="underline underline-offset-2"
                href="https://x.com/CompleteSkeptic/status/2099925682726002904"
                target="_blank"
                rel="noreferrer"
              >
                TypeSafe System One
              </a>
              .
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">choice · noul · score</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
        <div className="space-y-4">
          {!status?.hasKey && !statusError ? (
            <Alert>
              <KeyIcon />
              <AlertTitle>Fixture mode — no API key</AlertTitle>
              <AlertDescription>
                Set <code className="text-foreground">TYPESAFE_API_KEY</code> on the server (or{' '}
                <code className="text-foreground">AI_GATEWAY_API_KEY</code> for Vercel AI Gateway) and
                restart. The playground still runs against baked fixtures so you can demo the UI without a
                key. The key never ships to the browser.
              </AlertDescription>
            </Alert>
          ) : null}
          {statusError ? (
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertTitle>API unavailable</AlertTitle>
              <AlertDescription>{statusError}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>State</CardTitle>
              <CardDescription>
                Support ticket, email, or PR blurb. Questions stay fixed for this MVP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="sr-only" htmlFor="state">
                Unstructured text
              </label>
              <Textarea
                id="state"
                value={state}
                onChange={(event) => setState(event.target.value)}
                rows={12}
                placeholder="Paste a ticket…"
              />
              <div className="flex flex-wrap gap-1.5">
                {FIXTURES.map((fixture) => (
                  <Button
                    key={fixture.id}
                    type="button"
                    size="xs"
                    variant={fixtureId === fixture.id ? 'default' : 'outline'}
                    onClick={() => setState(fixture.text)}
                  >
                    {fixture.label}
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
              <Button type="button" onClick={onEvaluate} disabled={busy || !state.trim()}>
                <PlayIcon />
                {busy ? 'Evaluating…' : 'Run evaluation'}
              </Button>
              {error ? <p className="text-destructive">{error}</p> : null}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fixed questions</CardTitle>
              <CardDescription>Asked together against the same state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(status?.questions ?? defaultQuestions).map((question) => (
                <div key={question.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{question.type}</Badge>
                    <span className="font-medium">{question.title}</span>
                  </div>
                  <p className="text-muted-foreground">{question.instructions}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <ResultsPane result={result} busy={busy} />
      </main>
    </div>
  )
}

const defaultQuestions = [
  { id: 'category' as const, type: 'choice' as const, title: 'Category', instructions: 'What kind of ticket is this?' },
  { id: 'urgent' as const, type: 'boolean' as const, title: 'Urgent', instructions: 'Does this message convey urgency or time-sensitivity?' },
  { id: 'priority' as const, type: 'score' as const, title: 'Priority', instructions: 'How should this be prioritized?' },
]

function ModeBadge({ mode }: { mode: string }) {
  if (mode === 'typesafe') return <Badge>live · TypeSafe</Badge>
  if (mode === 'gateway') return <Badge>live · AI Gateway</Badge>
  return <Badge variant="secondary">fixture mode</Badge>
}

function ResultsPane({ result, busy }: { result: EvaluateResult | null; busy: boolean }) {
  if (busy && !result) {
    return (
      <Card className="min-h-[28rem]">
        <CardHeader className="border-b">
          <CardTitle>Decisions</CardTitle>
          <CardDescription>Evaluating the shared state…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card className="min-h-[28rem]">
        <CardHeader className="border-b">
          <CardTitle>Decisions</CardTitle>
          <CardDescription>Load a fixture or paste text, then run.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[20rem] items-center justify-center px-6 text-center text-muted-foreground">
          Probability bars for category, urgency, and priority will land here.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <EscalationCard result={result} />

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{result.category.title}</CardTitle>
              <CardDescription>{result.category.instructions}</CardDescription>
            </div>
            <Badge>{result.category.selectedLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <p className="text-muted-foreground">
            Selected <span className="text-foreground">{result.category.selectedLabel}</span>
            {' · '}
            confidence <span className="text-foreground tabular-nums">{pct(result.category.confidence)}</span>
          </p>
          <ProbabilityBars bars={result.category.probabilities} highlight={result.category.selected} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{result.urgent.title}</CardTitle>
              <CardDescription>{result.urgent.instructions}</CardDescription>
            </div>
            <Badge variant={result.urgent.yes >= 0.5 ? 'destructive' : 'secondary'}>
              {result.urgent.yes >= 0.5 ? 'Yes' : 'No'} {pct(result.urgent.yes)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <ProbabilityBars
            bars={[
              { key: 'yes', label: 'Yes', value: result.urgent.yes },
              { key: 'no', label: 'No', value: 1 - result.urgent.yes },
            ]}
            highlight={result.urgent.yes >= 0.5 ? 'yes' : 'no'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{result.priority.title}</CardTitle>
              <CardDescription>{result.priority.instructions}</CardDescription>
            </div>
            <Badge>
              {result.priority.level} {result.priority.score.toFixed(2)} / {result.priority.max}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <p className="text-muted-foreground">
            Score <span className="text-foreground tabular-nums">{result.priority.score.toFixed(2)}</span>
            {' · '}
            confidence <span className="text-foreground tabular-nums">{pct(result.priority.confidence)}</span>
          </p>
          <ProbabilityBars bars={result.priority.probabilities} highlight={result.priority.level} />
        </CardContent>
      </Card>
    </div>
  )
}

function EscalationCard({ result }: { result: EvaluateResult }) {
  const escalate = result.escalation.escalate
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Act vs escalate</CardTitle>
            <CardDescription>
              Auto-act when urgency, priority, and category confidence all stay inside the thresholds.
            </CardDescription>
          </div>
          <Badge variant={escalate ? 'destructive' : 'default'}>
            {escalate ? (
              <>
                <WarningCircleIcon />
                Escalate
              </>
            ) : (
              <>
                <LightningIcon />
                Act
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <p className="text-muted-foreground">
          Model <span className="text-foreground">{result.model}</span>
          {' · '}
          {result.mode === 'mock' ? 'fixture answers' : 'live Jev answers'}
        </p>
        <Separator />
        <ul className="space-y-2">
          {result.escalation.reasons.map((reason) => (
            <li key={reason.id} className="flex items-start justify-between gap-3">
              <span>
                <span className="text-foreground">{reason.label}</span>
                <span className="mt-0.5 block text-muted-foreground">{reason.detail}</span>
              </span>
              <Badge variant={reason.fired ? 'destructive' : 'outline'}>
                {reason.fired ? 'fires' : 'ok'}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
