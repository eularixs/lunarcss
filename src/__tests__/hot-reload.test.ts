// Hot-reload primitives. Two layers tested here:
//   1. `replaceTokens` — wholesale registry swap used by the boot path so
//      Fast Refresh re-evaluation of `@lunar-kit/css/__theme__` cleanly
//      reflects added, changed, AND removed tokens.
//   2. The Metro `withLunarCSS` watcher itself is exercised by integration
//      (real fs.watch + real lunar.config.ts edit), which we don't run in
//      unit tests — it's verified via the example app + `expo start --clear`.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  setTokens,
  replaceTokens,
  clearTokens,
  getToken,
  getAllTokens,
  getThemeHash,
} from '../runtime/tokens.js'

describe('replaceTokens', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('inserts new tokens', () => {
    replaceTokens({ '--color-primary': '#6366f1' })
    expect(getToken('--color-primary')).toBe('#6366f1')
  })

  it('overwrites changed tokens', () => {
    setTokens({ '--color-primary': '#000000', '--spacing-card': '24px' })
    replaceTokens({ '--color-primary': '#6366f1', '--spacing-card': '32px' })
    expect(getToken('--color-primary')).toBe('#6366f1')
    expect(getToken('--spacing-card')).toBe('32px')
  })

  it('removes tokens absent from the next map (vs setTokens which merges)', () => {
    setTokens({ '--color-primary': '#6366f1', '--color-stale': '#deadbe' })
    expect(getToken('--color-stale')).toBe('#deadbe')

    replaceTokens({ '--color-primary': '#6366f1' })
    expect(getToken('--color-stale')).toBeUndefined()
    expect(getToken('--color-primary')).toBe('#6366f1')
  })

  it('bumps the theme hash so cache lookups invalidate', () => {
    const before = getThemeHash()
    replaceTokens({ '--color-primary': '#6366f1' })
    expect(getThemeHash()).toBeGreaterThan(before)
  })

  it('handles empty input by clearing everything', () => {
    setTokens({ '--color-primary': '#6366f1', '--spacing-card': '24px' })
    replaceTokens({})
    expect(Object.keys(getAllTokens())).toHaveLength(0)
  })
})

describe('setTokens vs replaceTokens semantics', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('setTokens merges; replaceTokens swaps', () => {
    setTokens({ a: '1', b: '2' })
    setTokens({ b: '20', c: '3' })
    // setTokens keeps `a` even though the second call did not mention it.
    expect(getAllTokens()).toEqual({ a: '1', b: '20', c: '3' })

    replaceTokens({ b: '200', d: '4' })
    // replaceTokens drops `a` and `c`; only the new map remains.
    expect(getAllTokens()).toEqual({ b: '200', d: '4' })
  })
})
