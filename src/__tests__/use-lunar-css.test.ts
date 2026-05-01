import { describe, it, expect, beforeEach } from 'vitest'
import { setTokens, clearTokens } from '../runtime/tokens.js'
import { useLunarCSS } from '../runtime/use-lunar-css.js'

describe('useLunarCSS hook', () => {
  beforeEach(() => {
    clearTokens()
    setTokens({ '--color-primary': '#6366f1', '--spacing-card': '24px' })
  })

  it('tw() resolves classes via __lcssTw', () => {
    const { tw } = useLunarCSS()
    expect(tw('bg-primary p-card')).toEqual({
      backgroundColor: '#6366f1',
      padding: 24,
    })
  })

  it('token() returns bare-name lookups', () => {
    const { token } = useLunarCSS()
    expect(token('primary')).toBe('#6366f1')
    expect(token('--color-primary')).toBe('#6366f1')
    expect(token('missing')).toBeUndefined()
  })

  it('returns same singleton across calls', () => {
    expect(useLunarCSS()).toBe(useLunarCSS())
  })
})
