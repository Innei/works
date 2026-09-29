import { describe, expect, it } from 'vitest'

import { blendAt, hexToLinear, mixResolved, type Resolved } from './params'

const a: Resolved = {
  palette: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  modes: [1, 0, 0, 0],
  warp: 0,
  speed: 1,
  scale: 1,
  density: 0,
  dissipation: 0.9,
  grain: 0,
  saturation: 1,
  stretch: 1,
}

const b: Resolved = {
  palette: [1, 1, 1, 1, 1, 1, 1, 1, 1],
  modes: [0, 0, 0, 1],
  warp: 2,
  speed: 3,
  scale: 1,
  density: 1,
  dissipation: 0.99,
  grain: 0.5,
  saturation: 0,
  stretch: 3,
}

describe('hexToLinear', () => {
  it('converts sRGB hex to linear channels', () => {
    expect(hexToLinear('#ffffff')).toEqual([1, 1, 1])
    expect(hexToLinear('#000000')).toEqual([0, 0, 0])
    expect(hexToLinear('#808080')[0]).toBeCloseTo(0.2159, 3)
  })
})

describe('blendAt', () => {
  it('sits on a section exactly at integer progress', () => {
    expect(blendAt(3, 12)).toEqual({ from: 3, to: 4, t: 0 })
  })

  it('eases between neighbours', () => {
    const mid = blendAt(3.5, 12)
    expect(mid.from).toBe(3)
    expect(mid.to).toBe(4)
    expect(mid.t).toBeCloseTo(0.5)
    expect(blendAt(3.25, 12).t).toBeLessThan(0.25)
  })

  it('clamps overscroll at both ends', () => {
    expect(blendAt(-0.6, 12)).toEqual({ from: 0, to: 1, t: 0 })
    expect(blendAt(11.4, 12)).toEqual({ from: 11, to: 11, t: 0 })
  })
})

describe('mixResolved', () => {
  it('returns each endpoint at t = 0 and t = 1', () => {
    expect(mixResolved(a, b, 0)).toEqual(a)
    expect(mixResolved(a, b, 1)).toEqual(b)
  })

  it('interpolates every numeric field', () => {
    const m = mixResolved(a, b, 0.5)
    expect(m.palette[4]).toBeCloseTo(0.5)
    expect(m.modes).toEqual([0.5, 0, 0, 0.5])
    expect(m.warp).toBeCloseTo(1)
    expect(m.dissipation).toBeCloseTo(0.945)
  })
})
