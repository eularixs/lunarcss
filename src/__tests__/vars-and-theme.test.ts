import { describe, it, expect, beforeEach } from 'vitest'
import { setTokens, clearTokens } from '../runtime/tokens.js'
import { vars, lunarTheme, resolveToken } from '../runtime/vars.js'

describe('vars proxy and lunarTheme', () => {
  beforeEach(() => {
    clearTokens()
    setTokens({
      '--color-primary': '#6366f1',
      '--color-accent': '#f59e0b',
      '--color-surface': '#0b0b14',
      '--spacing-card': '24px',
      '--radius-card': '16px',
    })
  })

  it('vars resolves bare names against namespaces', () => {
    expect(vars.primary).toBe('#6366f1')
    expect(vars.accent).toBe('#f59e0b')
    expect(vars.card).toBe('24px')
  })

  it('vars returns undefined for unknown names', () => {
    expect(vars.unknown).toBeUndefined()
  })

  it('vars enumerates known short names via ownKeys', () => {
    const keys = Object.keys(vars)
    expect(keys).toContain('primary')
    expect(keys).toContain('accent')
    expect(keys).toContain('card')
  })

  it('resolveToken accepts fully-qualified --var', () => {
    expect(resolveToken('--color-primary')).toBe('#6366f1')
    expect(resolveToken('--missing')).toBeUndefined()
  })

  it('lunarTheme maps logical names to resolved values', () => {
    const theme = lunarTheme({
      background: '--color-surface',
      text: '--color-primary',
      border: 'accent',
    })
    expect(theme).toEqual({
      background: '#0b0b14',
      text: '#6366f1',
      border: '#f59e0b',
    })
  })

  it('lunarTheme returns undefined for unknown spec entries', () => {
    const theme = lunarTheme({ x: 'nope' })
    expect(theme.x).toBeUndefined()
  })
})
