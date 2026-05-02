// Diagnostics for the example motion screen. Validates the *class strings*
// that the screen feeds the resolver — not the rendered React tree, which
// would require jsdom + RN-Web in the test runner.
//
// Why this matters: utility generation alone does NOT create motion. Motion
// requires (a) a state change after initial paint and (b) a runtime that
// reads style keys (CSS on web, Reanimated on native). These tests assert
// the class strings include the transition + transform utilities, so the
// resolver emits the right intent. The runtime layer is exercised in the
// example app itself, not here.

import { describe, it, expect } from 'vitest'
import { resolveTransitions } from '../resolver/v4/utilities/transitions.js'
import { resolveTransforms } from '../resolver/v4/utilities/transforms.js'

const TOGGLE_COLORS_OFF = 'rounded-pill px-5 py-3 transition-colors duration-300 ease-in-out bg-primary'
const TOGGLE_COLORS_ON = 'rounded-pill px-5 py-3 transition-colors duration-300 ease-in-out bg-accent'

const TOGGLE_OPACITY_ON = 'size-12 rounded-md bg-accent transition-opacity duration-300 ease-out opacity-100'
const TOGGLE_OPACITY_OFF = 'size-12 rounded-md bg-accent transition-opacity duration-300 ease-out opacity-25'

const TOGGLE_SCALE_OFF = 'size-12 rounded-md bg-primary transition-transform duration-300 ease-in-out scale-100'
const TOGGLE_SCALE_ON = 'size-12 rounded-md bg-primary transition-transform duration-300 ease-in-out scale-150'

describe('motion example · class strings', () => {
  it('class-toggle color strings include transition-colors + duration + ease', () => {
    expect(TOGGLE_COLORS_OFF).toContain('transition-colors')
    expect(TOGGLE_COLORS_OFF).toContain('duration-300')
    expect(TOGGLE_COLORS_OFF).toContain('ease-in-out')
    expect(TOGGLE_COLORS_OFF).toContain('bg-primary')
    expect(TOGGLE_COLORS_ON).toContain('bg-accent')
    expect(TOGGLE_COLORS_OFF).not.toBe(TOGGLE_COLORS_ON)
  })

  it('class-toggle opacity strings differ only in opacity-* token', () => {
    const offTokens = TOGGLE_OPACITY_OFF.split(' ').filter((c) => !c.startsWith('opacity-'))
    const onTokens = TOGGLE_OPACITY_ON.split(' ').filter((c) => !c.startsWith('opacity-'))
    expect(offTokens).toEqual(onTokens)
    expect(TOGGLE_OPACITY_ON).toContain('opacity-100')
    expect(TOGGLE_OPACITY_OFF).toContain('opacity-25')
  })

  it('class-toggle scale strings differ only in scale-* token', () => {
    const offTokens = TOGGLE_SCALE_OFF.split(' ').filter((c) => !c.startsWith('scale-'))
    const onTokens = TOGGLE_SCALE_ON.split(' ').filter((c) => !c.startsWith('scale-'))
    expect(offTokens).toEqual(onTokens)
  })
})

describe('motion example · resolved style keys', () => {
  it('transition utility emits CSS time strings (not bare numbers)', () => {
    const tx = resolveTransitions('transition')!
    // RN-Web's value normalizer appends "px" to bare numbers — duration MUST
    // be a string so it survives as a real CSS time.
    expect(typeof tx.style.transitionDuration).toBe('string')
    expect(tx.style.transitionDuration).toMatch(/ms$/)
  })

  it('duration utility emits ms string', () => {
    expect(resolveTransitions('duration-300')!.style.transitionDuration).toBe('300ms')
  })

  it('delay utility emits ms string', () => {
    expect(resolveTransitions('delay-150')!.style.transitionDelay).toBe('150ms')
  })

  it('transition-colors limits property to color group', () => {
    const r = resolveTransitions('transition-colors')!
    expect(String(r.style.transitionProperty)).toContain('color')
    expect(String(r.style.transitionProperty)).toContain('background-color')
  })

  it('transform utilities still produce a transform array', () => {
    expect(resolveTransforms('rotate-12')!.style.transform).toEqual([{ rotate: '12deg' }])
    expect(resolveTransforms('scale-150')!.style.transform).toEqual([{ scale: 1.5 }])
  })
})
