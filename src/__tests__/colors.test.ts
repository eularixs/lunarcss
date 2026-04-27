import { describe, it, expect, beforeEach } from 'vitest'
import { resolveColor, toRNColor, applyAlpha } from '../resolver/v4/utilities/colors.js'
import { setTokens, clearTokens } from '../runtime/tokens.js'

describe('colors utility', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('resolves bg-primary via --color-primary token', () => {
    setTokens({ '--color-primary': '#6366f1' })
    const r = resolveColor('bg-primary')
    expect(r!.style).toEqual({ backgroundColor: '#6366f1' })
    expect(r!.tokensUsed).toContain('--color-primary')
  })

  it('resolves text-zinc-100 via Tailwind palette token', () => {
    setTokens({ '--color-zinc-100': '#f4f4f5' })
    const r = resolveColor('text-zinc-100')
    expect(r!.style).toEqual({ color: '#f4f4f5' })
  })

  it('resolves border-black to #000000', () => {
    const r = resolveColor('border-black')
    expect(r!.style).toEqual({ borderColor: '#000000' })
  })

  it('resolves bg-transparent', () => {
    const r = resolveColor('bg-transparent')
    expect(r!.style).toEqual({ backgroundColor: 'transparent' })
  })

  it('resolves arbitrary bg-[#fff]', () => {
    const r = resolveColor('bg-[#fff]')
    expect(r!.style).toEqual({ backgroundColor: '#ffffff' })
  })

  it('resolves arbitrary OKLCH bg-[oklch(0.6 0.15 264)]', () => {
    const r = resolveColor('bg-[oklch(0.6 0.15 264)]')
    expect(r!.style.backgroundColor).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('converts OKLCH token to hex on mobile', () => {
    setTokens({ '--color-primary': 'oklch(0.6 0.15 264)' })
    const r = resolveColor('bg-primary')
    expect(r!.style.backgroundColor).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('parses opacity suffix bg-primary/50 to rgba', () => {
    setTokens({ '--color-primary': '#6366f1' })
    const r = resolveColor('bg-primary/50')
    expect(r!.style.backgroundColor).toMatch(/^rgba\(\d+,\d+,\d+,0\.5\)$/)
  })

  it('parses opacity bg-black/0 to transparent', () => {
    const r = resolveColor('bg-black/0')
    expect(r!.style.backgroundColor).toBe('transparent')
  })

  it('opacity 1.0 leaves color unchanged', () => {
    expect(applyAlpha('#000000', 1)).toBe('#000000')
  })

  it('returns null for unknown color', () => {
    const r = resolveColor('bg-unknownish')
    expect(r).toBeNull()
  })

  it('toRNColor caches conversion', () => {
    const a = toRNColor('oklch(0.6 0.15 264)')
    const b = toRNColor('oklch(0.6 0.15 264)')
    expect(a).toBe(b)
  })

  it('ring-* maps to shadowColor', () => {
    const r = resolveColor('ring-black')
    expect(r!.style).toEqual({ shadowColor: '#000000' })
  })
})
