import { describe, expect, it } from 'vitest'
import { decideIntent } from './useHorizontalSwipe'

describe('decideIntent', () => {
  it('is undecided below the slop threshold', () => {
    expect(decideIntent(3, 2)).toBe(null)
    expect(decideIntent(7, 7)).toBe(null)
  })

  it('detects a horizontal swipe when dx dominates dy', () => {
    expect(decideIntent(40, 5)).toBe('horizontal')
    expect(decideIntent(-40, 5)).toBe('horizontal')
  })

  it('detects vertical scroll when dy is comparable or larger', () => {
    expect(decideIntent(20, 20)).toBe('vertical')
    expect(decideIntent(10, 40)).toBe('vertical')
  })

  it('respects the ratio: a shallow diagonal is still vertical', () => {
    // dx=30, dy=20 → 30 > 20*1.75 (35)? no → vertical
    expect(decideIntent(30, 20)).toBe('vertical')
    // dx=40, dy=20 → 40 > 35 → horizontal
    expect(decideIntent(40, 20)).toBe('horizontal')
  })

  it('honors a custom slop and ratio', () => {
    expect(decideIntent(10, 0, { slop: 20 })).toBe(null)
    expect(decideIntent(25, 10, { slop: 20, ratio: 3 })).toBe('vertical')
    expect(decideIntent(40, 10, { slop: 20, ratio: 3 })).toBe('horizontal')
  })
})
