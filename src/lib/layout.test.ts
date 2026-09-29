import { describe, expect, it } from 'vitest'

import { cardRect, focusFor } from './layout'

describe('focusFor', () => {
  it('puts the visual opposite the copy on wide screens', () => {
    expect(focusFor('left', true)).toEqual([0.68, 0.5])
    expect(focusFor('right', true)).toEqual([0.32, 0.5])
  })

  it('stacks the visual on top on narrow screens', () => {
    expect(focusFor('right', false)).toEqual([0.5, 0.7])
  })

  it('centres the overview', () => {
    expect(focusFor(undefined, true)).toEqual([0.6, 0.45])
  })
})

describe('cardRect', () => {
  it('fits a landscape shot to the width limit on wide screens', () => {
    const [, , hw, hh] = cardRect(16 / 10, 16 / 10, [0.68, 0.5], true)
    expect(hw).toBeCloseTo(0.21)
    expect(hh).toBeCloseTo(0.21)
  })

  it('fits a portrait shot to the height limit on wide screens', () => {
    const [cx, cy, hw, hh] = cardRect(9 / 19.5, 16 / 10, [0.32, 0.5], true)
    expect([cx, cy]).toEqual([0.32, 0.5])
    expect(hh).toBeCloseTo(0.34)
    expect(hw).toBeCloseTo((0.34 * (9 / 19.5)) / 1.6)
  })

  it('keeps shots inside the top area on narrow screens', () => {
    const [, , hw, hh] = cardRect(16 / 10, 390 / 844, [0.5, 0.7], false)
    expect(hw).toBeLessThanOrEqual(0.44)
    expect(hh).toBeLessThanOrEqual(0.2)
  })
})
