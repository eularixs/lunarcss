import { describe, it, expect, beforeEach } from 'vitest'
import { resolveTransforms } from '../resolver/v4/utilities/transforms.js'
import { resolveClassList } from '../resolver/v4/index.js'
import { clearTokens, setTokens } from '../runtime/tokens.js'
import type { RuntimeContext } from '../runtime/types.js'

const ctx: RuntimeContext = {
  platform: 'ios',
  colorScheme: 'light',
  width: 1024,
  state: {},
}

describe('transforms utility', () => {
  beforeEach(() => {
    clearTokens()
  })

  // Translate
  it('translate-x-4 → transform [{translateX:16}]', () => {
    expect(resolveTransforms('translate-x-4')!.style).toEqual({
      transform: [{ translateX: 16 }],
    })
  })
  it('translate-y-2 → transform [{translateY:8}]', () => {
    expect(resolveTransforms('translate-y-2')!.style).toEqual({
      transform: [{ translateY: 8 }],
    })
  })
  it('translate-4 → both axes', () => {
    expect(resolveTransforms('translate-4')!.style).toEqual({
      transform: [{ translateX: 16 }, { translateY: 16 }],
    })
  })
  it('-translate-x-4 → -16', () => {
    expect(resolveTransforms('-translate-x-4')!.style).toEqual({
      transform: [{ translateX: -16 }],
    })
  })
  it('translate-x-1/2 → 50%', () => {
    expect(resolveTransforms('translate-x-1/2')!.style).toEqual({
      transform: [{ translateX: '50%' }],
    })
  })
  it('translate-x-[20px] → 20', () => {
    expect(resolveTransforms('translate-x-[20px]')!.style).toEqual({
      transform: [{ translateX: 20 }],
    })
  })
  it('translate-x-full → 100%', () => {
    expect(resolveTransforms('translate-x-full')!.style).toEqual({
      transform: [{ translateX: '100%' }],
    })
  })
  it('-translate-x-full → -100%', () => {
    expect(resolveTransforms('-translate-x-full')!.style).toEqual({
      transform: [{ translateX: '-100%' }],
    })
  })
  it('translate-x-px → 1', () => {
    expect(resolveTransforms('translate-x-px')!.style).toEqual({
      transform: [{ translateX: 1 }],
    })
  })
  it('uses --spacing override for translate', () => {
    setTokens({ '--spacing': '8px' })
    expect(resolveTransforms('translate-x-2')!.style).toEqual({
      transform: [{ translateX: 16 }],
    })
  })

  it('translate-x-card resolves via --spacing-card token', () => {
    setTokens({ '--spacing-card': '24px' })
    const r = resolveTransforms('translate-x-card')!
    expect(r.style).toEqual({ transform: [{ translateX: 24 }] })
    expect(r.tokensUsed).toContain('--spacing-card')
  })

  it('-translate-y-card negates token value', () => {
    setTokens({ '--spacing-card': '24px' })
    const r = resolveTransforms('-translate-y-card')!
    expect(r.style).toEqual({ transform: [{ translateY: -24 }] })
  })

  it('translate-card both axes via token', () => {
    setTokens({ '--spacing-card': '24px' })
    const r = resolveTransforms('translate-card')!
    expect(r.style).toEqual({
      transform: [{ translateX: 24 }, { translateY: 24 }],
    })
  })

  it('translate-x-[card] (bracket form) returns null — brackets are raw CSS', () => {
    setTokens({ '--spacing-card': '24px' })
    expect(resolveTransforms('translate-x-[card]')).toBeNull()
  })

  // Rotate
  it('rotate-45 → 45deg', () => {
    expect(resolveTransforms('rotate-45')!.style).toEqual({
      transform: [{ rotate: '45deg' }],
    })
  })
  it('-rotate-45 → -45deg', () => {
    expect(resolveTransforms('-rotate-45')!.style).toEqual({
      transform: [{ rotate: '-45deg' }],
    })
  })
  it('rotate-[0.25turn] arbitrary keeps unit', () => {
    expect(resolveTransforms('rotate-[0.25turn]')!.style).toEqual({
      transform: [{ rotate: '0.25turn' }],
    })
  })
  it('rotate-x-30 → rotateX 30deg', () => {
    expect(resolveTransforms('rotate-x-30')!.style).toEqual({
      transform: [{ rotateX: '30deg' }],
    })
  })
  it('rotate-y-90', () => {
    expect(resolveTransforms('rotate-y-90')!.style).toEqual({
      transform: [{ rotateY: '90deg' }],
    })
  })
  it('rotate-z-15', () => {
    expect(resolveTransforms('rotate-z-15')!.style).toEqual({
      transform: [{ rotateZ: '15deg' }],
    })
  })

  // Scale
  it('scale-50 → 0.5', () => {
    expect(resolveTransforms('scale-50')!.style).toEqual({
      transform: [{ scale: 0.5 }],
    })
  })
  it('scale-100 → 1', () => {
    expect(resolveTransforms('scale-100')!.style).toEqual({
      transform: [{ scale: 1 }],
    })
  })
  it('scale-150 → 1.5', () => {
    expect(resolveTransforms('scale-150')!.style).toEqual({
      transform: [{ scale: 1.5 }],
    })
  })
  it('scale-x-110 → scaleX 1.1', () => {
    expect(resolveTransforms('scale-x-110')!.style).toEqual({
      transform: [{ scaleX: 1.1 }],
    })
  })
  it('scale-y-90', () => {
    expect(resolveTransforms('scale-y-90')!.style).toEqual({
      transform: [{ scaleY: 0.9 }],
    })
  })
  it('-scale-x-100 → -1 (mirror)', () => {
    expect(resolveTransforms('-scale-x-100')!.style).toEqual({
      transform: [{ scaleX: -1 }],
    })
  })
  it('scale-[1.2] arbitrary float', () => {
    expect(resolveTransforms('scale-[1.2]')!.style).toEqual({
      transform: [{ scale: 1.2 }],
    })
  })

  // Skew
  it('skew-x-12 → skewX 12deg', () => {
    expect(resolveTransforms('skew-x-12')!.style).toEqual({
      transform: [{ skewX: '12deg' }],
    })
  })
  it('skew-y-6', () => {
    expect(resolveTransforms('skew-y-6')!.style).toEqual({
      transform: [{ skewY: '6deg' }],
    })
  })
  it('-skew-x-12 → -12deg', () => {
    expect(resolveTransforms('-skew-x-12')!.style).toEqual({
      transform: [{ skewX: '-12deg' }],
    })
  })

  // transform-none
  it('transform-none → empty array', () => {
    expect(resolveTransforms('transform-none')!.style).toEqual({ transform: [] })
  })

  it('returns null for unknown', () => {
    expect(resolveTransforms('flip-x-4')).toBeNull()
  })
})

describe('transform array merging in resolveClassList', () => {
  beforeEach(() => clearTokens())

  it('concats transform ops in classlist order', () => {
    const r = resolveClassList('translate-x-4 rotate-45 scale-110', ctx)
    expect(r.style.transform).toEqual([
      { translateX: 16 },
      { rotate: '45deg' },
      { scale: 1.1 },
    ])
  })

  it('combines with non-transform styles without clobber', () => {
    const r = resolveClassList('p-4 rotate-45 bg-black', ctx)
    expect(r.style.padding).toBe(16)
    expect(r.style.transform).toEqual([{ rotate: '45deg' }])
    expect(r.style.backgroundColor).toBe('#000000')
  })

  it('translate-4 contributes two ops, rotate appends third', () => {
    const r = resolveClassList('translate-4 rotate-90', ctx)
    expect(r.style.transform).toEqual([
      { translateX: 16 },
      { translateY: 16 },
      { rotate: '90deg' },
    ])
  })
})
