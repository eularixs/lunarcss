import { describe, it, expect } from 'vitest'
import { parseTheme } from '../resolver/v4/parser.js'

describe('@theme parser', () => {
  it('extracts flat custom properties', () => {
    const css = `
      @theme {
        --color-primary: oklch(0.6 0.2 264);
        --spacing-xs: 4px;
        --font-size-display: 48px;
      }
    `
    const { tokens, errors } = parseTheme(css)
    expect(errors).toEqual([])
    expect(tokens['--color-primary']).toBe('oklch(0.6 0.2 264)')
    expect(tokens['--spacing-xs']).toBe('4px')
    expect(tokens['--font-size-display']).toBe('48px')
  })

  it('strips comments', () => {
    const css = `
      @theme {
        /* primary color */
        --color-primary: #6366f1;
      }
    `
    const { tokens } = parseTheme(css)
    expect(tokens['--color-primary']).toBe('#6366f1')
  })

  it('flags non-custom-property declarations', () => {
    const css = `@theme { color: red; }`
    const { tokens, errors } = parseTheme(css)
    expect(tokens).toEqual({})
    expect(errors.length).toBe(1)
  })

  it('returns empty object for missing @theme', () => {
    const { tokens, errors } = parseTheme(`body { color: red; }`)
    expect(tokens).toEqual({})
    expect(errors).toEqual([])
  })

  it('handles colons in values (e.g. cubic-bezier)', () => {
    const css = `@theme { --ease: cubic-bezier(0.4, 0, 0.2, 1); }`
    const { tokens } = parseTheme(css)
    expect(tokens['--ease']).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
  })
})
