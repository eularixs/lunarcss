import type { ResolveResult, ResolvedStyle } from '../../../runtime/types.js'
import { getToken } from '../../../runtime/tokens.js'
import { parseLength, parseLengthOrPercent } from './length.js'

interface SpacingPrefix {
  prefix: string
  keys: readonly string[]
}

const SPACING_PREFIXES: readonly SpacingPrefix[] = [
  { prefix: 'px', keys: ['paddingHorizontal'] },
  { prefix: 'py', keys: ['paddingVertical'] },
  { prefix: 'pt', keys: ['paddingTop'] },
  { prefix: 'pr', keys: ['paddingRight'] },
  { prefix: 'pb', keys: ['paddingBottom'] },
  { prefix: 'pl', keys: ['paddingLeft'] },
  { prefix: 'p', keys: ['padding'] },
  { prefix: 'mx', keys: ['marginHorizontal'] },
  { prefix: 'my', keys: ['marginVertical'] },
  { prefix: 'mt', keys: ['marginTop'] },
  { prefix: 'mr', keys: ['marginRight'] },
  { prefix: 'mb', keys: ['marginBottom'] },
  { prefix: 'ml', keys: ['marginLeft'] },
  { prefix: 'm', keys: ['margin'] },
  { prefix: 'gap-x', keys: ['columnGap'] },
  { prefix: 'gap-y', keys: ['rowGap'] },
  { prefix: 'gap', keys: ['gap'] },
  { prefix: 'inset', keys: ['top', 'right', 'bottom', 'left'] },
  { prefix: 'top', keys: ['top'] },
  { prefix: 'right', keys: ['right'] },
  { prefix: 'bottom', keys: ['bottom'] },
  { prefix: 'left', keys: ['left'] },
]

const DEFAULT_BASE_UNIT = 4

function getBaseUnit(): number {
  const v = getToken('--spacing')
  if (v === undefined) return DEFAULT_BASE_UNIT
  const parsed = parseLength(v)
  return parsed ?? DEFAULT_BASE_UNIT
}

function resolveValue(
  raw: string,
  tokensUsed: string[],
): number | string | null {
  // Arbitrary value: bracket syntax
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return parseLengthOrPercent(raw.slice(1, -1))
  }

  // Fraction: e.g. 1/2 → "50%"
  if (raw.includes('/')) {
    const [num, den] = raw.split('/')
    const n = Number.parseFloat(num ?? '')
    const d = Number.parseFloat(den ?? '')
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) {
      return `${(n / d) * 100}%`
    }
    return null
  }

  // Keyword: full → 100%, auto → 'auto', px → 1 hairline
  if (raw === 'full') return '100%'
  if (raw === 'auto') return 'auto'
  if (raw === 'px') return 1

  // Numeric scale: 4 → 4 * baseUnit
  const num = Number.parseFloat(raw)
  if (Number.isFinite(num) && /^-?\d*\.?\d+$/.test(raw)) {
    return num * getBaseUnit()
  }

  // Named token: lookup --spacing-{name}
  const tokenName = `--spacing-${raw}`
  const tokenValue = getToken(tokenName)
  if (tokenValue !== undefined) {
    tokensUsed.push(tokenName)
    return parseLengthOrPercent(tokenValue)
  }

  return null
}

export function resolveSpacing(className: string): ResolveResult | null {
  let cls = className
  let negative = false
  if (cls.startsWith('-')) {
    negative = true
    cls = cls.slice(1)
  }

  for (const { prefix, keys } of SPACING_PREFIXES) {
    if (cls === prefix || cls.startsWith(`${prefix}-`)) {
      const rest = cls === prefix ? '' : cls.slice(prefix.length + 1)
      if (!rest) continue

      const tokensUsed: string[] = ['--spacing']
      const value = resolveValue(rest, tokensUsed)
      if (value === null) return null

      const final =
        typeof value === 'number' && negative ? -value : value

      const style: ResolvedStyle = {}
      for (const k of keys) style[k] = final
      return { style, tokensUsed }
    }
  }

  return null
}
