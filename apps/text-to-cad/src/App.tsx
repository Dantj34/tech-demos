import { DownloadSimpleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { MeshPreview } from '@/components/mesh-preview'
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
import { generatePart, type GenerateResult } from '@/lib/api'

const EXAMPLES = [
  'a 20mm cube with a 5mm hole',
  'a simple bracket',
  '30mm cylinder 10mm tall',
  'washer 25mm OD 8mm ID',
  '50mm flange with 4 M6 holes',
] as const

export default function App() {
  const [prompt, setPrompt] = useState<string>(EXAMPLES[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)

  async function onGenerate() {
    setBusy(true)
    setError(null)
    try {
      const next = await generatePart(prompt)
      setResult(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl tracking-tight">text-to-cad</h1>
              <Badge variant="outline">MVP template mapper</Badge>
            </div>
            <p className="max-w-xl text-xs text-muted-foreground">
              Type a short part prompt. A constrained catalog maps it to a{' '}
              <span className="text-foreground">build123d</span> solid (inspired by{' '}
              <a
                className="underline underline-offset-2"
                href="https://github.com/earthtojake/text-to-cad"
                target="_blank"
                rel="noreferrer"
              >
                earthtojake/text-to-cad
              </a>
              ) — no agent skills required at runtime.
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Preview GLB · download STL / GLB
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Describe a part</CardTitle>
            <CardDescription>
              Catalog: cube, cube with hole, cylinder, washer, L-bracket, flange.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="sr-only" htmlFor="prompt">
              Part prompt
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              placeholder="a 20mm cube with a 5mm hole"
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <Button
                  key={example}
                  type="button"
                  size="xs"
                  variant={prompt === example ? 'default' : 'outline'}
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2">
            <Button type="button" onClick={onGenerate} disabled={busy}>
              {busy ? 'Generating…' : 'Generate mesh'}
            </Button>
            {error ? <p className="text-destructive">{error}</p> : null}
            {result ? (
              <div className="space-y-1 text-muted-foreground">
                <p className="text-foreground">{result.label}</p>
                <p>
                  kind <span className="text-foreground">{result.kind}</span>
                  {result.guessed ? ' · guessed' : ''}
                </p>
                {result.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            ) : null}
          </CardFooter>
        </Card>

        <Card className="min-h-[28rem]">
          <CardHeader className="border-b">
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {result
                ? `bbox ${fmt(result.bbox.x)} × ${fmt(result.bbox.y)} × ${fmt(result.bbox.z)} mm`
                : 'Orbit the generated solid after a successful run.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[28rem]">
              <MeshPreview url={result?.glbUrl ?? null} />
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              disabled={!result}
              render={
                <a href={result?.stlUrl} download={`${result?.kind ?? 'part'}.stl`}>
                  <DownloadSimpleIcon />
                  STL
                </a>
              }
            />
            <Button
              nativeButton={false}
              variant="outline"
              disabled={!result}
              render={
                <a href={result?.glbUrl} download={`${result?.kind ?? 'part'}.glb`}>
                  <DownloadSimpleIcon />
                  GLB
                </a>
              }
            />
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

function fmt(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}
