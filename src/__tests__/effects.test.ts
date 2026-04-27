import { describe, it, expect } from 'vitest'
import { resolveEffects } from '../resolver/v4/utilities/effects.js'

describe('effects utility', () => {
  it('opacity-0', () => {
    expect(resolveEffects('opacity-0')!.style).toEqual({ opacity: 0 })
  })
  it('opacity-50', () => {
    expect(resolveEffects('opacity-50')!.style).toEqual({ opacity: 0.5 })
  })
  it('opacity-100', () => {
    expect(resolveEffects('opacity-100')!.style).toEqual({ opacity: 1 })
  })
  it('opacity-95', () => {
    expect(resolveEffects('opacity-95')!.style).toEqual({ opacity: 0.95 })
  })
  it('opacity-[0.42] arbitrary', () => {
    expect(resolveEffects('opacity-[0.42]')!.style).toEqual({ opacity: 0.42 })
  })
  it('opacity-999 returns null', () => {
    expect(resolveEffects('opacity-999')).toBeNull()
  })

  it('shadow → md preset', () => {
    const r = resolveEffects('shadow')!
    expect(r.style.shadowColor).toBe('#000000')
    expect(r.style.shadowOpacity).toBe(0.1)
    expect(r.style.elevation).toBe(3)
  })
  it('shadow-none', () => {
    const r = resolveEffects('shadow-none')!
    expect(r.style.shadowOpacity).toBe(0)
    expect(r.style.elevation).toBe(0)
  })
  it('shadow-sm', () => {
    const r = resolveEffects('shadow-sm')!
    expect(r.style.shadowRadius).toBe(2)
    expect(r.style.elevation).toBe(1)
  })
  it('shadow-lg', () => {
    const r = resolveEffects('shadow-lg')!
    expect(r.style.shadowRadius).toBe(15)
    expect(r.style.elevation).toBe(5)
  })
  it('shadow-2xl', () => {
    const r = resolveEffects('shadow-2xl')!
    expect(r.style.shadowOpacity).toBe(0.25)
    expect(r.style.shadowRadius).toBe(50)
    expect(r.style.elevation).toBe(12)
  })
  it('shadow-black returns null (defer to colors)', () => {
    expect(resolveEffects('shadow-black')).toBeNull()
  })
})
