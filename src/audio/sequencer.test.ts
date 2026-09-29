import { describe, expect, it } from 'vitest'

import { hit, schedule, stepSeconds, type Groove } from './sequencer'

const g = (bpm: number, swing = 0): Groove => ({ bpm, swing, pad: [60, 64, 67], voices: { kick: 'x...x...x...x...' } })

describe('hit', () => {
  it('reads velocity per step', () => {
    expect(hit('x.X.', 0)).toBe(0.7)
    expect(hit('x.X.', 1)).toBe(0)
    expect(hit('x.X.', 2)).toBe(1)
  })

  it('repeats short patterns across the bar', () => {
    expect(hit('x...', 4)).toBe(0.7)
    expect(hit(undefined, 3)).toBe(0)
  })
})

describe('schedule', () => {
  it('emits 16th steps at the groove tempo', () => {
    const r = schedule({ step: 0, time: 0 }, 0.5, g(120), null)
    expect(stepSeconds(120)).toBeCloseTo(0.125)
    expect(r.events.map((e) => e.time)).toEqual([0, 0.125, 0.25, 0.375])
    expect(r.clock).toEqual({ step: 4, time: 0.5 })
  })

  it('delays odd steps by swing', () => {
    const r = schedule({ step: 0, time: 0 }, 0.26, g(120, 0.5), null)
    expect(r.events[1].time).toBeCloseTo(0.125 + 0.0625)
    expect(r.events[2].time).toBeCloseTo(0.25)
  })

  it('switches to a pending groove only on the next bar', () => {
    const next = g(60)
    const r = schedule({ step: 14, time: 0 }, 0.6, g(120), next)
    expect(r.events.map((e) => e.groove.bpm)).toEqual([120, 120, 60, 60])
    expect(r.events[2].step).toBe(0)
    expect(r.events[3].time).toBeCloseTo(0.25 + 0.25)
    expect(r.groove).toBe(next)
    expect(r.pending).toBeNull()
  })

  it('keeps the pending groove when the bar line is not reached', () => {
    const next = g(60)
    const r = schedule({ step: 3, time: 0 }, 0.2, g(120), next)
    expect(r.events.every((e) => e.groove.bpm === 120)).toBe(true)
    expect(r.pending).toBe(next)
  })
})
