export const PART_KINDS = [
  'cube',
  'cube_with_hole',
  'cylinder',
  'washer',
  'bracket',
  'flange',
] as const

export type PartKind = (typeof PART_KINDS)[number]

export type MappedPart = {
  kind: PartKind
  params: Record<string, number>
  label: string
  notes: string[]
  guessed: boolean
}

const DEFAULTS: Record<PartKind, Record<string, number>> = {
  cube: { size: 20 },
  cube_with_hole: { size: 20, hole: 5, height: 20 },
  cylinder: { diameter: 20, height: 30 },
  washer: { od: 24, id: 8, thickness: 3 },
  bracket: { width: 40, height: 30, depth: 30, thickness: 4, hole: 6 },
  flange: { od: 50, id: 16, thickness: 6, bolt_count: 4, bolt: 6, bolt_circle: 33 },
}

function toMm(value: number, unit?: string): number {
  const u = (unit ?? 'mm').toLowerCase()
  if (u === 'cm') return value * 10
  if (u.startsWith('in')) return value * 25.4
  return value
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function numberBefore(prompt: string, keywords: string[]): number | undefined {
  for (const keyword of keywords) {
    const re = new RegExp(
      `(\\d+(?:\\.\\d+)?)\\s*(mm|cm|in(?:ch(?:es)?)?)?\\s+${escapeRe(keyword)}`,
      'i',
    )
    const match = prompt.match(re)
    if (match) return toMm(Number(match[1]), match[2])
  }
  return undefined
}

function numberAfter(prompt: string, keywords: string[]): number | undefined {
  for (const keyword of keywords) {
    const re = new RegExp(
      `${escapeRe(keyword)}[^\\d]{0,8}(\\d+(?:\\.\\d+)?)\\s*(mm|cm|in(?:ch(?:es)?)?)?`,
      'i',
    )
    const match = prompt.match(re)
    if (match) return toMm(Number(match[1]), match[2])
  }
  return undefined
}

function numberFor(prompt: string, keywords: string[]): number | undefined {
  return numberBefore(prompt, keywords) ?? numberAfter(prompt, keywords)
}

function allNumbers(prompt: string): number[] {
  const out: number[] = []
  const re = /(\d+(?:\.\d+)?)\s*(mm|cm|in(?:ch(?:es)?)?)?/gi
  for (const match of prompt.matchAll(re)) {
    out.push(toMm(Number(match[1]), match[2]))
  }
  return out
}

function detectKind(prompt: string): { kind: PartKind; guessed: boolean } {
  const p = prompt.toLowerCase()
  if (/\bflange\b/.test(p)) return { kind: 'flange', guessed: false }
  if (/\b(bracket|l-?bracket|angle bracket)\b/.test(p)) return { kind: 'bracket', guessed: false }
  if (/\b(washer|gasket|ring)\b/.test(p)) return { kind: 'washer', guessed: false }
  if (/\b(cube|box|block)\b/.test(p) && /\b(hole|bore|through)\b/.test(p)) {
    return { kind: 'cube_with_hole', guessed: false }
  }
  if (/\b(cylinder|rod|puck|disk|disc)\b/.test(p)) return { kind: 'cylinder', guessed: false }
  if (/\b(cube|box|block)\b/.test(p)) return { kind: 'cube', guessed: false }
  if (/\b(hole|bore)\b/.test(p)) return { kind: 'cube_with_hole', guessed: false }
  return { kind: 'cube_with_hole', guessed: true }
}

function finish(
  kind: PartKind,
  params: Record<string, number>,
  notes: string[],
  guessed: boolean,
): MappedPart {
  const merged = { ...DEFAULTS[kind], ...params }

  if (kind === 'cube') {
    merged.size = clamp(merged.size, 2, 200)
  }
  if (kind === 'cube_with_hole') {
    merged.size = clamp(merged.size, 4, 200)
    merged.height = clamp(merged.height ?? merged.size, 2, 200)
    merged.hole = clamp(merged.hole, 1, merged.size * 0.85)
  }
  if (kind === 'cylinder') {
    merged.diameter = clamp(merged.diameter, 2, 200)
    merged.height = clamp(merged.height, 1, 300)
  }
  if (kind === 'washer' || kind === 'flange') {
    merged.od = clamp(merged.od, 4, 200)
    merged.id = clamp(merged.id, 1, merged.od * 0.85)
    merged.thickness = clamp(merged.thickness, 0.5, 40)
  }
  if (kind === 'flange') {
    merged.bolt_count = clamp(Math.round(merged.bolt_count), 3, 12)
    merged.bolt = clamp(merged.bolt, 1, (merged.od - merged.id) / 2)
    const mid = (merged.od + merged.id) / 2
    merged.bolt_circle = clamp(merged.bolt_circle ?? mid, merged.id + merged.bolt, merged.od - merged.bolt)
  }
  if (kind === 'bracket') {
    merged.width = clamp(merged.width, 8, 200)
    merged.height = clamp(merged.height, 8, 200)
    merged.depth = clamp(merged.depth, 8, 200)
    merged.thickness = clamp(merged.thickness, 1, 20)
    merged.hole = clamp(merged.hole, 1, Math.min(merged.width, merged.height) * 0.5)
  }

  return {
    kind,
    params: merged,
    label: labelFor(kind, merged),
    notes,
    guessed,
  }
}

function labelFor(kind: PartKind, params: Record<string, number>): string {
  const mm = (n: number) => `${round(n)}mm`
  switch (kind) {
    case 'cube':
      return `${mm(params.size)} cube`
    case 'cube_with_hole':
      return `${mm(params.size)} cube × ${mm(params.height)} with ${mm(params.hole)} hole`
    case 'cylinder':
      return `${mm(params.diameter)} cylinder × ${mm(params.height)}`
    case 'washer':
      return `${mm(params.od)} washer, ${mm(params.id)} ID × ${mm(params.thickness)}`
    case 'bracket':
      return `${mm(params.width)} L-bracket, ${mm(params.thickness)} thick`
    case 'flange':
      return `${mm(params.od)} flange, ${params.bolt_count}×${mm(params.bolt)} bolts`
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

export function mapPrompt(prompt: string): MappedPart {
  const text = prompt.trim()
  const notes: string[] = []
  if (!text) {
    notes.push('Empty prompt — using the default demo cube with a hole.')
    return finish('cube_with_hole', {}, notes, true)
  }

  const { kind, guessed } = detectKind(text)
  const nums = allNumbers(text)
  const params: Record<string, number> = {}

  if (guessed) {
    notes.push(
      'No catalog keyword matched — mapped to a cube with a hole (MVP template path, not LLM codegen).',
    )
  }

  if (kind === 'cube') {
    const size = numberFor(text, ['cube', 'box', 'block', 'size']) ?? nums[0]
    if (size) params.size = size
  }

  if (kind === 'cube_with_hole') {
    const size = numberFor(text, ['cube', 'box', 'block', 'size']) ?? nums[0]
    const hole = numberFor(text, ['hole', 'bore']) ?? nums[1]
    const height = numberFor(text, ['tall', 'height', 'thick'])
    if (size) params.size = size
    if (hole) params.hole = hole
    if (height) params.height = height
  }

  if (kind === 'cylinder') {
    const diameter = numberFor(text, ['diameter', 'cylinder', 'rod']) ?? nums[0]
    const height = numberFor(text, ['tall', 'height', 'long']) ?? nums[1]
    if (diameter) params.diameter = diameter
    if (height) params.height = height
  }

  if (kind === 'washer') {
    const od = numberFor(text, ['od', 'outer', 'outside']) ?? numberFor(text, ['washer']) ?? nums[0]
    const id = numberFor(text, ['id', 'inner', 'inside']) ?? nums[1]
    const thickness = numberFor(text, ['thick', 'thickness']) ?? nums[2]
    if (od) params.od = od
    if (id) params.id = id
    if (thickness) params.thickness = thickness
  }

  if (kind === 'flange') {
    const od = numberFor(text, ['flange', 'od', 'outer']) ?? nums[0]
    const id = numberFor(text, ['id', 'inner', 'bore'])
    const thickness = numberFor(text, ['thick', 'thickness'])
    const metric = text.match(/\b(\d+)\s*M(\d+(?:\.\d+)?)\b/i)
    const bolt = metric ? Number(metric[2]) : numberFor(text, ['bolt', 'screw'])
    const countMatch =
      metric ?? text.match(/\b(\d+)\s*[x×]\b/i) ?? text.match(/\b(\d+)\s+bolts?\b/i)
    if (od) params.od = od
    if (id) params.id = id
    if (thickness) params.thickness = thickness
    if (bolt) params.bolt = bolt
    if (countMatch) params.bolt_count = Number(countMatch[1])
  }

  if (kind === 'bracket') {
    const width = numberFor(text, ['wide', 'width', 'bracket']) ?? nums[0]
    const height = numberFor(text, ['tall', 'height']) ?? nums[1]
    const thickness = numberFor(text, ['thick', 'thickness'])
    const hole = numberFor(text, ['hole', 'bore'])
    if (width) params.width = width
    if (height) params.height = height
    if (thickness) params.thickness = thickness
    if (hole) params.hole = hole
  }

  notes.push(`Mapped via constrained template catalog → build123d (${kind}).`)
  return finish(kind, params, notes, guessed)
}

export const EXAMPLE_PROMPTS = [
  'a 20mm cube with a 5mm hole',
  'a simple bracket',
  '30mm cylinder 10mm tall',
  'washer 25mm OD 8mm ID',
  '50mm flange with 4 M6 holes',
  '40mm cube',
] as const
