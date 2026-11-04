export type Machine = {
  id: 'v8-live' | 'cessna-live' | 'strandbeest-live'
  title: string
  kicker: string
  blurb: string
  src: string
  steal: string
}

export const MACHINES: Machine[] = [
  {
    id: 'v8-live',
    title: 'V8 · Four-Stroke',
    kicker: '90° cross-plane · 5.8 L',
    blurb:
      'Glass liners, eight pistons from the exact slider-crank, firing order 1-8-4-3-6-5-7-2. Cutaway (glass / section / solid), isolate, live indicator diagram.',
    src: '/sims/v8-live.html',
    steal: 'Cutaways + cylinder picker',
  },
  {
    id: 'cessna-live',
    title: 'Cessna 337 gear',
    kicker: '201 mm rack · 32-tooth pinion',
    blurb:
      'Main landing gear folds into the airframe on takeoff and drops on landing. One degree of freedom poses the whole mechanism; a runway rolls under it.',
    src: '/sims/cessna-live.html',
    steal: 'Stroke 0–1 driving the fold',
  },
  {
    id: 'strandbeest-live',
    title: 'Strandbeest SB-10',
    kicker: 'Theo Jansen · 20 legs',
    blurb:
      'One crankshaft, Jansen’s 11 link lengths, wind integrating crank speed. Isolate a leg, trace feet, read contact of all twenty on the sand.',
    src: '/sims/strandbeest-live.html',
    steal: 'Exact linkage in 67 lines',
  },
]
