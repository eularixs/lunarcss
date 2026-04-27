import { describe, it, expect } from 'vitest'
import { flattenTokens } from '../config/flatten.js'

describe('flattenTokens', () => {
  it('handles empty config', () => {
    expect(flattenTokens(null)).toEqual({})
    expect(flattenTokens(undefined)).toEqual({})
    expect(flattenTokens({})).toEqual({})
    expect(flattenTokens({ theme: {} })).toEqual({})
  })

  it('flattens colors namespace', () => {
    const out = flattenTokens({
      theme: { extend: { colors: { primary: '#6366f1', accent: 'oklch(0.7 0.1 200)' } } },
    })
    expect(out).toEqual({
      '--color-primary': '#6366f1',
      '--color-accent': 'oklch(0.7 0.1 200)',
    })
  })

  it('flattens spacing + width + radius', () => {
    const out = flattenTokens({
      theme: {
        extend: {
          spacing: { xs: '4px' },
          width: { card: '320px' },
          borderRadius: { card: '14px' },
        },
      },
    })
    expect(out).toEqual({
      '--spacing-xs': '4px',
      '--width-card': '320px',
      '--radius-card': '14px',
    })
  })

  it('flattens fontSize tuple to size + line-height pair', () => {
    const out = flattenTokens({
      theme: { extend: { fontSize: { display: ['48px', '52px'] } } },
    })
    expect(out).toEqual({
      '--text-display': '48px',
      '--text-display--line-height': '52px',
    })
  })

  it('flat tokens override namespaced', () => {
    const out = flattenTokens({
      theme: {
        extend: { colors: { primary: '#000' } },
        tokens: { '--color-primary': '#fff', '--custom': 'value' },
      },
    })
    expect(out).toEqual({
      '--color-primary': '#fff',
      '--custom': 'value',
    })
  })
})
