// Web tw runtime — same resolver as native. RN-Web strips `className` from
// primitives, so we cannot rely on Tailwind on the DOM; instead we run the
// lunar resolver here and let RN-Web's StyleSheet emit atomic CSS from the
// resulting style object.

import { describe, it, expect, beforeEach } from 'vitest'
import { __lcssTw, tw } from '../runtime/tw.web.js'
import { setTokens, clearTokens } from '../runtime/tokens.js'

describe('runtime/tw.web (engine parity with native)', () => {
  beforeEach(() => {
    clearTokens()
    setTokens({ '--color-primary': '#6366f1', '--spacing-card': '24px' })
  })

  it('__lcssTw resolves classes to RN style objects', () => {
    expect(__lcssTw('bg-primary p-card')).toEqual({
      backgroundColor: '#6366f1',
      padding: 24,
    })
  })

  it('returns {} for empty input', () => {
    expect(__lcssTw('')).toEqual({})
  })

  it('tw is an alias for __lcssTw', () => {
    expect(tw('flex-1')).toEqual(__lcssTw('flex-1'))
  })
})
