import type { ResolveResult, ResolvedStyle } from '../../../runtime/types.js'
import { getToken } from '../../../runtime/tokens.js'
import { parseLength } from './length.js'

const RADIUS_SCALE: Readonly<Record<string, number>> = {
  none: 0,
  sm: 2,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
}

const BORDER_WIDTHS: Readonly<Record<string, number>> = {
  '': 1, // bare `border`
  '0': 0,
  '2': 2,
  '4': 4,
  '8': 8,
}

const BORDER_STYLES: Readonly<Record<string, string>> = {
  'border-solid': 'solid',
  'border-dashed': 'dashed',
  'border-dotted': 'dotted',
}

interface RadiusSide {
  prefix: string
  keys: readonly string[]
}

const RADIUS_SIDES: readonly RadiusSide[] = [
  { prefix: 'rounded-tl', keys: ['borderTopLeftRadius'] },
  { prefix: 'rounded-tr', keys: ['borderTopRightRadius'] },
  { prefix: 'rounded-br', keys: ['borderBottomRightRadius'] },
  { prefix: 'rounded-bl', keys: ['borderBottomLeftRadius'] },
  { prefix: 'rounded-t', keys: ['borderTopLeftRadius', 'borderTopRightRadius'] },
  { prefix: 'rounded-r', keys: ['borderTopRightRadius', 'borderBottomRightRadius'] },
  { prefix: 'rounded-b', keys: ['borderBottomLeftRadius', 'borderBottomRightRadius'] },
  { prefix: 'rounded-l', keys: ['borderTopLeftRadius', 'borderBottomLeftRadius'] },
  { prefix: 'rounded', keys: ['borderRadius'] },
]

interface BorderSide {
  prefix: string
  key: string
}

const BORDER_SIDES: readonly BorderSide[] = [
  { prefix: 'border-t', key: 'borderTopWidth' },
  { prefix: 'border-r', key: 'borderRightWidth' },
  { prefix: 'border-b', key: 'borderBottomWidth' },
  { prefix: 'border-l', key: 'borderLeftWidth' },
]

function resolveRadiusValue(rest: string, tokensUsed: string[]): number | null {
  if (rest === 'md-default-fallback') return 6
  if (rest in RADIUS_SCALE) return RADIUS_SCALE[rest] as number
  if (rest.startsWith('[') && rest.endsWith(']')) {
    return parseLength(rest.slice(1, -1))
  }
  // Token --radius-{name}
  const tokenName = `--radius-${rest}`
  const tokenValue = getToken(tokenName)
  if (tokenValue !== undefined) {
    tokensUsed.push(tokenName)
    return parseLength(tokenValue)
  }
  return null
}

function resolveBorderWidthValue(rest: string): number | null {
  if (rest in BORDER_WIDTHS) return BORDER_WIDTHS[rest] as number
  if (rest.startsWith('[') && rest.endsWith(']')) {
    return parseLength(rest.slice(1, -1))
  }
  const n = Number.parseInt(rest, 10)
  if (Number.isFinite(n) && /^\d+$/.test(rest)) return n
  return null
}

export function resolveBorders(className: string): ResolveResult | null {
  // Border style keywords
  const styleVal = BORDER_STYLES[className]
  if (styleVal) return { style: { borderStyle: styleVal }, tokensUsed: [] }

  // Bare `border` → 1
  if (className === 'border') {
    return { style: { borderWidth: 1 }, tokensUsed: [] }
  }

  // Radius (check before border to avoid `rounded-` collisions)
  for (const { prefix, keys } of RADIUS_SIDES) {
    if (className === prefix) {
      // bare `rounded` → default 6
      const style: ResolvedStyle = {}
      for (const k of keys) style[k] = 6
      return { style, tokensUsed: [] }
    }
    if (className.startsWith(`${prefix}-`)) {
      const rest = className.slice(prefix.length + 1)
      const tokensUsed: string[] = []
      const value = resolveRadiusValue(rest, tokensUsed)
      if (value === null) return null
      const style: ResolvedStyle = {}
      for (const k of keys) style[k] = value
      return { style, tokensUsed }
    }
  }

  // Side-specific border width
  for (const { prefix, key } of BORDER_SIDES) {
    if (className.startsWith(`${prefix}-`)) {
      const rest = className.slice(prefix.length + 1)
      const value = resolveBorderWidthValue(rest)
      if (value === null) return null
      return { style: { [key]: value }, tokensUsed: [] }
    }
    if (className === prefix) {
      return { style: { [key]: 1 }, tokensUsed: [] }
    }
  }

  // Generic `border-N` width
  if (className.startsWith('border-')) {
    const rest = className.slice('border-'.length)
    // Skip color-like values; let colors resolver handle. Only match width tokens.
    const value = resolveBorderWidthValue(rest)
    if (value !== null) return { style: { borderWidth: value }, tokensUsed: [] }
  }

  return null
}
