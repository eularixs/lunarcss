import { describe, it, expect } from 'vitest'
import { resolveTransitions } from '../resolver/v4/utilities/transitions.js'
import { resolveClassList } from '../resolver/v4/index.js'
import type { RuntimeContext } from '../runtime/types.js'

const ctx: RuntimeContext = {
  platform: 'ios',
  colorScheme: 'light',
  width: 1024,
  state: {},
}

describe('transitions utility', () => {
  it('transition emits default property + duration + ease', () => {
    const r = resolveTransitions('transition')!
    expect(r.style.transitionDuration).toBe('150ms')
    expect(r.style.transitionTimingFunction).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
    expect(String(r.style.transitionProperty)).toContain('color')
    expect(String(r.style.transitionProperty)).toContain('opacity')
  })

  it('transition-colors limits property to color group', () => {
    const r = resolveTransitions('transition-colors')!
    expect(String(r.style.transitionProperty)).toContain('color')
    expect(String(r.style.transitionProperty)).toContain('background-color')
    expect(String(r.style.transitionProperty)).not.toContain('opacity')
  })

  it('transition-opacity', () => {
    const r = resolveTransitions('transition-opacity')!
    expect(r.style.transitionProperty).toBe('opacity')
  })

  it('transition-transform', () => {
    const r = resolveTransitions('transition-transform')!
    expect(r.style.transitionProperty).toBe('transform')
  })

  it('transition-none zeros out duration', () => {
    const r = resolveTransitions('transition-none')!
    expect(r.style.transitionProperty).toBe('none')
    expect(r.style.transitionDuration).toBe('0ms')
  })

  it('duration-300 sets ms', () => {
    expect(resolveTransitions('duration-300')!.style.transitionDuration).toBe('300ms')
  })

  it('duration-[200ms] arbitrary', () => {
    expect(resolveTransitions('duration-[200ms]')!.style.transitionDuration).toBe('200ms')
  })

  it('duration-[0.3s] arbitrary seconds → ms', () => {
    expect(resolveTransitions('duration-[0.3s]')!.style.transitionDuration).toBe('300ms')
  })

  it('delay-150', () => {
    expect(resolveTransitions('delay-150')!.style.transitionDelay).toBe('150ms')
  })

  it('ease-in-out maps to cubic-bezier', () => {
    expect(resolveTransitions('ease-in-out')!.style.transitionTimingFunction).toBe(
      'cubic-bezier(0.4, 0, 0.2, 1)',
    )
  })

  it('ease-linear', () => {
    expect(resolveTransitions('ease-linear')!.style.transitionTimingFunction).toBe('linear')
  })

  it('ease-[cubic-bezier(0.1,0.7,1,0.1)] arbitrary', () => {
    expect(
      resolveTransitions('ease-[cubic-bezier(0.1,0.7,1,0.1)]')!.style.transitionTimingFunction,
    ).toBe('cubic-bezier(0.1,0.7,1,0.1)')
  })

  it('returns null for non-transition class', () => {
    expect(resolveTransitions('flex-1')).toBeNull()
  })
})

describe('combined transform + transition + color', () => {
  it('rotate-12 + transition-transform + duration-300 + bg-primary merge', () => {
    const out = resolveClassList(
      'rotate-12 transition-transform duration-300 ease-out bg-[#10b981]',
      ctx,
    )
    expect(out.style.transform).toEqual([{ rotate: '12deg' }])
    expect(out.style.transitionProperty).toBe('transform')
    expect(out.style.transitionDuration).toBe('300ms')
    expect(String(out.style.transitionTimingFunction)).toContain('cubic-bezier')
    expect(out.style.backgroundColor).toBe('#10b981')
  })

  it('bare `transform` does not crash and yields empty array', () => {
    const out = resolveClassList('transform', ctx)
    expect(out.style.transform).toEqual([])
  })

  it('transform + scale-110 yields scale op', () => {
    const out = resolveClassList('transform scale-110', ctx)
    expect(out.style.transform).toEqual([{ scale: 1.1 }])
  })
})
