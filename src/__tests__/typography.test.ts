import { describe, it, expect, beforeEach } from 'vitest'
import { resolveTypography } from '../resolver/v4/utilities/typography.js'
import { resolveClassList } from '../resolver/v4/index.js'
import { setTokens, clearTokens } from '../runtime/tokens.js'
import type { RuntimeContext } from '../runtime/types.js'

const ctx: RuntimeContext = {
  platform: 'ios',
  colorScheme: 'light',
  width: 1024,
  state: {},
}

describe('typography utility', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('text-sm → fontSize 14 + lineHeight 20', () => {
    expect(resolveTypography('text-sm')!.style).toEqual({ fontSize: 14, lineHeight: 20 })
  })

  it('text-2xl → 24/32', () => {
    expect(resolveTypography('text-2xl')!.style).toEqual({ fontSize: 24, lineHeight: 32 })
  })

  it('text-9xl → 128/128', () => {
    expect(resolveTypography('text-9xl')!.style).toEqual({ fontSize: 128, lineHeight: 128 })
  })

  it('text-[18px] arbitrary', () => {
    expect(resolveTypography('text-[18px]')!.style).toEqual({ fontSize: 18 })
  })

  it('text-display token override', () => {
    setTokens({ '--text-display': '48px', '--text-display--line-height': '52px' })
    const r = resolveTypography('text-display')!
    expect(r.style).toEqual({ fontSize: 48, lineHeight: 52 })
    expect(r.tokensUsed).toContain('--text-display')
  })

  it('font-bold → 700', () => {
    expect(resolveTypography('font-bold')!.style).toEqual({ fontWeight: '700' })
  })

  it('font-extralight → 200', () => {
    expect(resolveTypography('font-extralight')!.style).toEqual({ fontWeight: '200' })
  })

  it('font-[Inter] arbitrary family', () => {
    expect(resolveTypography('font-[Inter]')!.style).toEqual({ fontFamily: 'Inter' })
  })

  it('leading-4 numeric → 16', () => {
    expect(resolveTypography('leading-4')!.style).toEqual({ lineHeight: 16 })
  })

  it('leading-[20px] arbitrary', () => {
    expect(resolveTypography('leading-[20px]')!.style).toEqual({ lineHeight: 20 })
  })

  it('leading-tight emits multiplier marker', () => {
    const r = resolveTypography('leading-tight')!
    expect(r.style).toEqual({ __leadingMultiplier: 1.25 })
  })

  it('text-base + leading-tight resolves to absolute lineHeight via post-process', () => {
    const r = resolveClassList('text-base leading-tight', ctx)
    expect(r.style.fontSize).toBe(16)
    expect(r.style.lineHeight).toBe(20) // 16 * 1.25
    expect(r.style.__leadingMultiplier).toBeUndefined()
  })

  it('tracking-wider → letterSpacing 0.8', () => {
    expect(resolveTypography('tracking-wider')!.style).toEqual({ letterSpacing: 0.8 })
  })

  it('tracking-[2px] arbitrary', () => {
    expect(resolveTypography('tracking-[2px]')!.style).toEqual({ letterSpacing: 2 })
  })

  it('text-center', () => {
    expect(resolveTypography('text-center')!.style).toEqual({ textAlign: 'center' })
  })

  it('italic / not-italic', () => {
    expect(resolveTypography('italic')!.style).toEqual({ fontStyle: 'italic' })
    expect(resolveTypography('not-italic')!.style).toEqual({ fontStyle: 'normal' })
  })

  it('underline / line-through / no-underline', () => {
    expect(resolveTypography('underline')!.style).toEqual({ textDecorationLine: 'underline' })
    expect(resolveTypography('line-through')!.style).toEqual({ textDecorationLine: 'line-through' })
    expect(resolveTypography('no-underline')!.style).toEqual({ textDecorationLine: 'none' })
  })

  it('uppercase / lowercase / capitalize / normal-case', () => {
    expect(resolveTypography('uppercase')!.style).toEqual({ textTransform: 'uppercase' })
    expect(resolveTypography('lowercase')!.style).toEqual({ textTransform: 'lowercase' })
    expect(resolveTypography('capitalize')!.style).toEqual({ textTransform: 'capitalize' })
    expect(resolveTypography('normal-case')!.style).toEqual({ textTransform: 'none' })
  })

  it('returns null for unknown', () => {
    expect(resolveTypography('text-foo-bar-baz-zz')).toBeNull()
  })
})
