import { describe, it, expect, beforeEach } from 'vitest'
import { resolveSpacing } from '../resolver/v4/utilities/spacing.js'
import { setTokens, clearTokens } from '../runtime/tokens.js'

describe('spacing utility', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('resolves p-4 to padding 16', () => {
    const r = resolveSpacing('p-4')
    expect(r).not.toBeNull()
    expect(r!.style).toEqual({ padding: 16 })
  })

  it('resolves px-2 to paddingHorizontal 8', () => {
    const r = resolveSpacing('px-2')
    expect(r!.style).toEqual({ paddingHorizontal: 8 })
  })

  it('resolves py-3 to paddingVertical 12', () => {
    const r = resolveSpacing('py-3')
    expect(r!.style).toEqual({ paddingVertical: 12 })
  })

  it('resolves m-0 to margin 0', () => {
    const r = resolveSpacing('m-0')
    expect(r!.style).toEqual({ margin: 0 })
  })

  it('resolves negative -mt-4 to marginTop -16', () => {
    const r = resolveSpacing('-mt-4')
    expect(r!.style).toEqual({ marginTop: -16 })
  })

  it('resolves arbitrary p-[10px] to padding 10', () => {
    const r = resolveSpacing('p-[10px]')
    expect(r!.style).toEqual({ padding: 10 })
  })

  it('resolves arbitrary p-[1rem] to padding 16', () => {
    const r = resolveSpacing('p-[1rem]')
    expect(r!.style).toEqual({ padding: 16 })
  })

  it('resolves fractional w-style fraction p-1/2 to "50%"', () => {
    const r = resolveSpacing('p-1/2')
    expect(r!.style).toEqual({ padding: '50%' })
  })

  it('resolves m-auto to margin "auto"', () => {
    const r = resolveSpacing('m-auto')
    expect(r!.style).toEqual({ margin: 'auto' })
  })

  it('resolves p-px to padding 1', () => {
    const r = resolveSpacing('p-px')
    expect(r!.style).toEqual({ padding: 1 })
  })

  it('resolves p-full to padding "100%"', () => {
    const r = resolveSpacing('p-full')
    expect(r!.style).toEqual({ padding: '100%' })
  })

  it('resolves named token p-card via --spacing-card', () => {
    setTokens({ '--spacing-card': '24px' })
    const r = resolveSpacing('p-card')
    expect(r!.style).toEqual({ padding: 24 })
    expect(r!.tokensUsed).toContain('--spacing-card')
  })

  it('uses --spacing token to override base unit', () => {
    setTokens({ '--spacing': '8px' })
    const r = resolveSpacing('p-2')
    expect(r!.style).toEqual({ padding: 16 })
  })

  it('inset-0 expands to top/right/bottom/left', () => {
    const r = resolveSpacing('inset-0')
    expect(r!.style).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
  })

  it('gap-4 maps to gap', () => {
    const r = resolveSpacing('gap-4')
    expect(r!.style).toEqual({ gap: 16 })
  })

  it('gap-x-4 maps to columnGap', () => {
    const r = resolveSpacing('gap-x-4')
    expect(r!.style).toEqual({ columnGap: 16 })
  })

  it('returns null for unknown class', () => {
    const r = resolveSpacing('flex-1')
    expect(r).toBeNull()
  })

  it('records --spacing as token used', () => {
    const r = resolveSpacing('p-4')
    expect(r!.tokensUsed).toContain('--spacing')
  })
})
