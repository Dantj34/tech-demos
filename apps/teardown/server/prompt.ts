import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SKILL = readFileSync(join(import.meta.dir, '..', 'vendor', 'teardown', 'SKILL.md'), 'utf8')

export const GENERATE_CONTRACT = `You are answering a web demo, not Claude Code. There is no filesystem, no \`sims/build.mjs\`, no Playwright, no ffmpeg, and no Python.

Return ONE complete self-contained HTML document that is a teardown-style interactive 3D simulator of the machine the user describes.

Output rules:
- Reply with HTML only. No markdown fences, no preamble. Start with <!doctype html>.
- Inline CSS and JavaScript. You MAY load three.js 0.186.1 from an import map pointing at https://unpkg.com/three@0.186.1/build/three.module.js and matching addons under https://unpkg.com/three@0.186.1/examples/jsm/. Do not load any other origins.
- Include: one math model that both poses the parts and feeds the gauges, subsystem buttons, at least one cutaway or isolate mode, orbit-drag, and an idle auto-tour that yields on input.
- Procedural three.js geometry only (no GLB). Pale studio, one accent color. Keep it a single file.
- Skip film recording, sound, capture, and any multi-file layout.
- If a reference image is attached, match it. Otherwise use real typical dimensions, not invented styling.

Follow the engineering rules in the skill (real numbers, one input drives everything, the working part opens up).`

export function systemPrompt(): string {
  return `${GENERATE_CONTRACT}\n\n---\n\nUpstream skill (elvarofficial/teardown):\n\n${SKILL}`
}
