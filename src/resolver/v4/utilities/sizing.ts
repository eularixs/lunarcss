import type { ResolveResult, ResolvedStyle } from '../../../runtime/types.js'
import { getToken } from '../../../runtime/tokens.js'
import { parseLength, parseLengthOrPercent } from './length.js'

interface SizingPrefix {
  prefix: string
  key: string
  tokenNamespace: 'spacing' | 'width' | 'height' | 'min-width' | 'max-width' | 'min-height' | 'max-height'
}

const SIZING_PREFIXES: readonly SizingPrefix[] = [
  { prefix: 'min-w', key: 'minWidth', tokenNamespace: 'min-width' },
  { prefix: 'max-w', key: 'maxWidth', tokenNamespace: 'max-width' },
  { prefix: 'min-h', key: 'minHeight', tokenNamespace: 'min-height' },
  { prefix: 'max-h', key: 'maxHeight', tokenNamespace: 'max-height' },
  { prefix: 'w', key: 'width', tokenNamespace: 'width' },
  { prefix: 'h', key: 'height', tokenNamespace: 'height' },
  { prefix: 'size', key: '__size', tokenNamespace: 'spacing' },
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
  ns: SizingPrefix['tokenNamespace'],
  tokensUsed: string[],
): number | string | null {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return parseLengthOrPercent(raw.slice(1, -1))
  }
  if (raw.includes('/')) {
    const [num, den] = raw.split('/')
    const n = Number.parseFloat(num ?? '')
    const d = Number.parseFloat(den ?? '')
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) {
      return `${(n / d) * 100}%`
    }
    return null
  }
  if (raw === 'full') return '100%'
  if (raw === 'auto') return 'auto'
  if (raw === 'screen') return '100%' // RN approximation; no viewport unit
  if (raw === 'min') return null
  if (raw === 'max') return null
  if (raw === 'fit') return null
  if (raw === 'px') return 1

  const num = Number.parseFloat(raw)
  if (Number.isFinite(num) && /^-?\d*\.?\d+$/.test(raw)) {
    tokensUsed.push('--spacing')
    return num * getBaseUnit()
  }

  // Named token: try namespace-specific token first, then fall back to spacing.
  const nsTokenName = `--${ns}-${raw}`
  const nsTokenValue = getToken(nsTokenName)
  if (nsTokenValue !== undefined) {
    tokensUsed.push(nsTokenName)
    return parseLengthOrPercent(nsTokenValue)
  }
  const spacingTokenName = `--spacing-${raw}`
  const spacingTokenValue = getToken(spacingTokenName)
  if (spacingTokenValue !== undefined) {
    tokensUsed.push(spacingTokenName)
    return parseLengthOrPercent(spacingTokenValue)
  }
  return null
}

export function resolveSizing(className: string): ResolveResult | null {
  for (const { prefix, key, tokenNamespace } of SIZING_PREFIXES) {
    if (!className.startsWith(`${prefix}-`)) continue
    const rest = className.slice(prefix.length + 1)
    if (!rest) continue

    const tokensUsed: string[] = []
    const value = resolveValue(rest, tokenNamespace, tokensUsed)
    if (value === null) return null

    const style: ResolvedStyle = {}
    if (key === '__size') {
      style.width = value
      style.height = value
    } else {
      style[key] = value
    }
    return { style, tokensUsed }
  }
  return null
}
