import { describe, expect, it } from 'vitest'

import { activeIndex, isMounted, sceneWeight } from './progress'

describe('activeIndex', () => {
  it('rounds to the nearest section', () => {
    expect(activeIndex(0, 12)).toBe(0)
    expect(activeIndex(0.49, 12)).toBe(0)
    expect(activeIndex(0.5, 12)).toBe(1)
    expect(activeIndex(4.7, 12)).toBe(5)
  })

  it('clamps overscroll to valid sections', () => {
    expect(activeIndex(-0.8, 12)).toBe(0)
    expect(activeIndex(11.9, 12)).toBe(11)
    expect(activeIndex(40, 12)).toBe(11)
  })
})

describe('sceneWeight', () => {
  it('is 1 when the section is fully in view', () => {
    expect(sceneWeight(3, 3)).toBe(1)
  })

  it('falls off linearly toward neighbours', () => {
    expect(sceneWeight(3.25, 3)).toBeCloseTo(0.75)
    expect(sceneWeight(2.5, 3)).toBeCloseTo(0.5)
  })

  it('is 0 one section away or further', () => {
    expect(sceneWeight(4, 3)).toBe(0)
    expect(sceneWeight(9, 3)).toBe(0)
  })
})

describe('isMounted', () => {
  it('keeps neighbours within 1.5 sections mounted', () => {
    expect(isMounted(3, 4)).toBe(true)
    expect(isMounted(3, 1.6)).toBe(true)
    expect(isMounted(3, 1.5)).toBe(false)
    expect(isMounted(3, 6)).toBe(false)
  })
})
