import { describe, it, expect } from 'vitest'
import { resolveLayout } from '../resolver/v4/utilities/layout.js'

describe('layout utility', () => {
  it('flex → display flex', () => {
    expect(resolveLayout('flex')!.style).toEqual({ display: 'flex' })
  })
  it('hidden → display none', () => {
    expect(resolveLayout('hidden')!.style).toEqual({ display: 'none' })
  })
  it('flex-row', () => {
    expect(resolveLayout('flex-row')!.style).toEqual({ flexDirection: 'row' })
  })
  it('flex-col-reverse', () => {
    expect(resolveLayout('flex-col-reverse')!.style).toEqual({ flexDirection: 'column-reverse' })
  })
  it('flex-1', () => {
    expect(resolveLayout('flex-1')!.style).toEqual({ flex: 1 })
  })
  it('flex-2 (numeric)', () => {
    expect(resolveLayout('flex-2')!.style).toEqual({ flex: 2 })
  })
  it('flex-auto', () => {
    expect(resolveLayout('flex-auto')!.style).toEqual({ flexGrow: 1, flexShrink: 1, flexBasis: 'auto' })
  })
  it('items-center', () => {
    expect(resolveLayout('items-center')!.style).toEqual({ alignItems: 'center' })
  })
  it('justify-between', () => {
    expect(resolveLayout('justify-between')!.style).toEqual({ justifyContent: 'space-between' })
  })
  it('self-stretch', () => {
    expect(resolveLayout('self-stretch')!.style).toEqual({ alignSelf: 'stretch' })
  })
  it('absolute', () => {
    expect(resolveLayout('absolute')!.style).toEqual({ position: 'absolute' })
  })
  it('overflow-hidden', () => {
    expect(resolveLayout('overflow-hidden')!.style).toEqual({ overflow: 'hidden' })
  })
  it('z-10', () => {
    expect(resolveLayout('z-10')!.style).toEqual({ zIndex: 10 })
  })
  it('z-[99]', () => {
    expect(resolveLayout('z-[99]')!.style).toEqual({ zIndex: 99 })
  })
  it('returns null for unknown', () => {
    expect(resolveLayout('blah-blah')).toBeNull()
  })
})
