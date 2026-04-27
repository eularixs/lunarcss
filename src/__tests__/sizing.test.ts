import { describe, it, expect, beforeEach } from 'vitest'
import { resolveSizing } from '../resolver/v4/utilities/sizing.js'
import { setTokens, clearTokens } from '../runtime/tokens.js'

describe('sizing utility', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('w-4 → width 16', () => {
    expect(resolveSizing('w-4')!.style).toEqual({ width: 16 })
  })
  it('h-8 → height 32', () => {
    expect(resolveSizing('h-8')!.style).toEqual({ height: 32 })
  })
  it('w-full → 100%', () => {
    expect(resolveSizing('w-full')!.style).toEqual({ width: '100%' })
  })
  it('w-1/2 → 50%', () => {
    expect(resolveSizing('w-1/2')!.style).toEqual({ width: '50%' })
  })
  it('h-auto', () => {
    expect(resolveSizing('h-auto')!.style).toEqual({ height: 'auto' })
  })
  it('w-px → 1', () => {
    expect(resolveSizing('w-px')!.style).toEqual({ width: 1 })
  })
  it('w-[200px] → 200', () => {
    expect(resolveSizing('w-[200px]')!.style).toEqual({ width: 200 })
  })
  it('w-screen approximated to 100%', () => {
    expect(resolveSizing('w-screen')!.style).toEqual({ width: '100%' })
  })
  it('min-w-0 → minWidth 0', () => {
    expect(resolveSizing('min-w-0')!.style).toEqual({ minWidth: 0 })
  })
  it('max-h-96 → maxHeight 384', () => {
    expect(resolveSizing('max-h-96')!.style).toEqual({ maxHeight: 384 })
  })
  it('size-10 → width + height 40', () => {
    expect(resolveSizing('size-10')!.style).toEqual({ width: 40, height: 40 })
  })
  it('w-card via --width-card token', () => {
    setTokens({ '--width-card': '320px' })
    const r = resolveSizing('w-card')
    expect(r!.style).toEqual({ width: 320 })
    expect(r!.tokensUsed).toContain('--width-card')
  })
  it('falls back to --spacing-{name} when namespaced token missing', () => {
    setTokens({ '--spacing-card': '24px' })
    const r = resolveSizing('w-card')
    expect(r!.style).toEqual({ width: 24 })
    expect(r!.tokensUsed).toContain('--spacing-card')
  })
})
