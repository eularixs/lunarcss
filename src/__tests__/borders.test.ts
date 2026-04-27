import { describe, it, expect, beforeEach } from 'vitest'
import { resolveBorders } from '../resolver/v4/utilities/borders.js'
import { setTokens, clearTokens } from '../runtime/tokens.js'

describe('borders utility', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('rounded → 6 default', () => {
    expect(resolveBorders('rounded')!.style).toEqual({ borderRadius: 6 })
  })
  it('rounded-none', () => {
    expect(resolveBorders('rounded-none')!.style).toEqual({ borderRadius: 0 })
  })
  it('rounded-sm', () => {
    expect(resolveBorders('rounded-sm')!.style).toEqual({ borderRadius: 2 })
  })
  it('rounded-md', () => {
    expect(resolveBorders('rounded-md')!.style).toEqual({ borderRadius: 6 })
  })
  it('rounded-lg', () => {
    expect(resolveBorders('rounded-lg')!.style).toEqual({ borderRadius: 8 })
  })
  it('rounded-xl', () => {
    expect(resolveBorders('rounded-xl')!.style).toEqual({ borderRadius: 12 })
  })
  it('rounded-2xl', () => {
    expect(resolveBorders('rounded-2xl')!.style).toEqual({ borderRadius: 16 })
  })
  it('rounded-3xl', () => {
    expect(resolveBorders('rounded-3xl')!.style).toEqual({ borderRadius: 24 })
  })
  it('rounded-full', () => {
    expect(resolveBorders('rounded-full')!.style).toEqual({ borderRadius: 9999 })
  })
  it('rounded-[10px] arbitrary', () => {
    expect(resolveBorders('rounded-[10px]')!.style).toEqual({ borderRadius: 10 })
  })
  it('rounded-t-lg', () => {
    expect(resolveBorders('rounded-t-lg')!.style).toEqual({
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    })
  })
  it('rounded-tr-md', () => {
    expect(resolveBorders('rounded-tr-md')!.style).toEqual({ borderTopRightRadius: 6 })
  })
  it('rounded-bl-2xl', () => {
    expect(resolveBorders('rounded-bl-2xl')!.style).toEqual({ borderBottomLeftRadius: 16 })
  })
  it('rounded-card via --radius-card', () => {
    setTokens({ '--radius-card': '14px' })
    const r = resolveBorders('rounded-card')!
    expect(r.style).toEqual({ borderRadius: 14 })
    expect(r.tokensUsed).toContain('--radius-card')
  })

  it('border → 1', () => {
    expect(resolveBorders('border')!.style).toEqual({ borderWidth: 1 })
  })
  it('border-0', () => {
    expect(resolveBorders('border-0')!.style).toEqual({ borderWidth: 0 })
  })
  it('border-2', () => {
    expect(resolveBorders('border-2')!.style).toEqual({ borderWidth: 2 })
  })
  it('border-4', () => {
    expect(resolveBorders('border-4')!.style).toEqual({ borderWidth: 4 })
  })
  it('border-8', () => {
    expect(resolveBorders('border-8')!.style).toEqual({ borderWidth: 8 })
  })
  it('border-t → 1', () => {
    expect(resolveBorders('border-t')!.style).toEqual({ borderTopWidth: 1 })
  })
  it('border-r-2', () => {
    expect(resolveBorders('border-r-2')!.style).toEqual({ borderRightWidth: 2 })
  })
  it('border-b-4', () => {
    expect(resolveBorders('border-b-4')!.style).toEqual({ borderBottomWidth: 4 })
  })
  it('border-l-8', () => {
    expect(resolveBorders('border-l-8')!.style).toEqual({ borderLeftWidth: 8 })
  })
  it('border-solid / dashed / dotted', () => {
    expect(resolveBorders('border-solid')!.style).toEqual({ borderStyle: 'solid' })
    expect(resolveBorders('border-dashed')!.style).toEqual({ borderStyle: 'dashed' })
    expect(resolveBorders('border-dotted')!.style).toEqual({ borderStyle: 'dotted' })
  })
  it('returns null for non-border', () => {
    expect(resolveBorders('bg-red')).toBeNull()
  })
})
