import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveContainers } from '../resolver/v4/utilities/containers.js'
import { resolveClassList } from '../resolver/v4/index.js'
import { modifiersMatch } from '../runtime/platform.js'
import type { RuntimeContext } from '../runtime/types.js'

const ctx: RuntimeContext = {
  platform: 'ios',
  colorScheme: 'light',
  width: 1024,
  state: {},
}

describe('containers utility (mobile no-op)', () => {
  it('@container → empty style, no error', () => {
    const r = resolveContainers('@container')!
    expect(r.style).toEqual({})
    expect(r.tokensUsed).toEqual([])
  })
  it('@container-normal → empty style', () => {
    expect(resolveContainers('@container-normal')!.style).toEqual({})
  })
  it('@container-size → empty style', () => {
    expect(resolveContainers('@container-size')!.style).toEqual({})
  })
  it('@container/sidebar (named) → empty style', () => {
    expect(resolveContainers('@container/sidebar')!.style).toEqual({})
  })
  it('returns null for non-container class', () => {
    expect(resolveContainers('@sm')).toBeNull()
    expect(resolveContainers('flex')).toBeNull()
  })
})

describe('container-query modifiers on mobile (silent skip)', () => {
  it('@sm: modifier skips silently — no warn, no style', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = resolveClassList('@sm:flex', ctx)
    expect(r.style).toEqual({})
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('@md:bg-primary stripped without warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = resolveClassList('@md:bg-primary', ctx)
    expect(r.style.backgroundColor).toBeUndefined()
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('mixed list: real classes resolve, @sm: skipped', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = resolveClassList('p-4 @sm:hidden flex-row', ctx)
    expect(r.style.padding).toBe(16)
    expect(r.style.flexDirection).toBe('row')
    expect(r.style.display).toBeUndefined()
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('modifiersMatch returns false for @-prefixed modifiers on mobile', () => {
    expect(modifiersMatch(['@sm'], ctx)).toBe(false)
    expect(modifiersMatch(['@container/sidebar'], ctx)).toBe(false)
  })

  it('does not crash with @container utility followed by classes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = resolveClassList('@container p-4', ctx)
    expect(r.style.padding).toBe(16)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('@container does not collide with other utilities', () => {
  beforeEach(() => {})
  it('flex and @container together resolve flex normally', () => {
    const r = resolveClassList('@container flex', ctx)
    expect(r.style.display).toBe('flex')
  })
})
