import {
  AirplaneTakeoffIcon,
  ArrowLeftIcon,
  CubeIcon,
  ImageIcon,
  PersonSimpleWalkIcon,
  WarningCircleIcon,
  WindIcon,
} from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { SimulatorFrame } from '@/components/simulator-frame'
import { fetchStatus, fileToImagePayload, generateMachine, type Status } from '@/lib/api'
import { MACHINES, type Machine } from '@/lib/machines'

type Viewer =
  | { kind: 'bundled'; machine: Machine }
  | { kind: 'generated'; title: string; html: string }

const ICONS: Record<Machine['id'], ReactNode> = {
  'v8-live': <CubeIcon />,
  'cessna-live': <AirplaneTakeoffIcon />,
  'strandbeest-live': <PersonSimpleWalkIcon />,
}

const EXAMPLES = [
  'a 4-stroke single-cylinder motorcycle engine I can take apart',
  'a hydraulic excavator arm with one boom cylinder',
  'Theo Jansen’s 11-bar walking linkage, one leg',
] as const

export default function App() {
  const [status, setStatus] = useState<Status | null>(null)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [prompt, setPrompt] = useState<string>(EXAMPLES[0])
  const [image, setImage] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchStatus()
      .then((next) => {
        if (!cancelled) setStatus(next)
      })
      .catch(() => {
        if (!cancelled) setStatus({ generateEnabled: false, model: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onGenerate() {
    setBusy(true)
    setError(null)
    try {
      const payload = image ? await fileToImagePayload(image) : undefined
      const result = await generateMachine(prompt, payload)
      setViewer({ kind: 'generated', title: result.title, html: result.html })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (viewer) {
    const title = viewer.kind === 'bundled' ? viewer.machine.title : viewer.title
    return (
      <div className="flex h-svh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b px-3 py-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setViewer(null)}>
            <ArrowLeftIcon />
            Gallery
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm">{title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {viewer.kind === 'bundled'
                ? 'Bundled simulator · drag to orbit · buttons take it apart'
                : 'Generated page · sandboxed iframe (scripts only)'}
            </p>
          </div>
          <Badge variant="outline">{viewer.kind === 'bundled' ? 'offline HTML' : 'sandbox'}</Badge>
        </header>
        <div className="min-h-0 flex-1">
          {viewer.kind === 'bundled' ? (
            <SimulatorFrame title={viewer.machine.title} src={viewer.machine.src} />
          ) : (
            <SimulatorFrame title={viewer.title} srcDoc={viewer.html} sandboxed />
          )}
        </div>
      </div>
    )
  }

  const generateOn = status?.generateEnabled === true

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl tracking-tight">teardown</h1>
              <Badge variant="outline">3 bundled machines</Badge>
            </div>
            <p className="max-w-2xl text-xs text-muted-foreground">
              Interactive 3D machine simulators as single offline HTML pages — take-apart, cutaways,
              live gauges, auto tour. Not a photo-to-3D model. Built from{' '}
              <a
                className="underline underline-offset-2"
                href="https://github.com/elvarofficial/teardown"
                target="_blank"
                rel="noreferrer"
              >
                elvarofficial/teardown
              </a>{' '}
              (MIT) at{' '}
              <span className="text-foreground">a91262a</span>.
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">Gallery works with no API key</p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
        <section className="grid gap-4 md:grid-cols-3">
          {MACHINES.map((machine) => (
            <Card key={machine.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {ICONS[machine.id]}
                  {machine.title}
                </CardTitle>
                <CardDescription>{machine.kicker}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>{machine.blurb}</p>
                <p className="text-muted-foreground">Worth stealing: {machine.steal}</p>
              </CardContent>
              <CardFooter>
                <Button type="button" className="w-full" onClick={() => setViewer({ kind: 'bundled', machine })}>
                  Open simulator
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WindIcon />
              Describe a machine
            </CardTitle>
            <CardDescription>
              Optional. Server calls Claude with the upstream SKILL.md and shows the HTML in a
              sandboxed iframe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status && !generateOn ? (
              <div className="flex gap-2 border border-border bg-muted/40 px-2.5 py-2 text-muted-foreground">
                <WarningCircleIcon className="mt-0.5 size-4 shrink-0" />
                <p>
                  Set <span className="text-foreground">ANTHROPIC_API_KEY</span> on the Bun server
                  (never a <span className="text-foreground">VITE_</span> var) and restart. The
                  three bundled machines above do not need a key.
                </p>
              </div>
            ) : null}
            <label className="sr-only" htmlFor="prompt">
              Machine description
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              disabled={!generateOn || busy}
              placeholder="a 4-stroke motorcycle engine I can take apart"
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <Button
                  key={example}
                  type="button"
                  size="xs"
                  variant={prompt === example ? 'default' : 'outline'}
                  disabled={!generateOn || busy}
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
              <ImageIcon />
              <span>{image ? image.name : 'Optional reference image'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                disabled={!generateOn || busy}
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              />
            </label>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button type="button" onClick={onGenerate} disabled={!generateOn || busy}>
              {busy ? 'Building…' : 'Generate HTML'}
            </Button>
            {error ? <p className="text-destructive">{error}</p> : null}
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
