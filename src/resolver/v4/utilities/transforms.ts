import type { ResolveResult, ResolvedStyle, TransformOp } from '../../../runtime/types.js'
import { getToken } from '../../../runtime/tokens.js'
import { parseLength } from './length.js'

const DEFAULT_BASE_UNIT = 4

function getBaseUnit(): number {
  const v = getToken('--spacing')
  if (v === undefined) return DEFAULT_BASE_UNIT
  return parseLength(v) ?? DEFAULT_BASE_UNIT
}

function matchPrefix(cls: string, prefix: string): string | null {
  if (cls === prefix) return ''
  if (cls.startsWith(`${prefix}-`)) return cls.slice(prefix.length + 1)
  return null
}

function parseTranslateValue(
  raw: string,
  tokensUsed: string[],
): number | string | null {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1)
    if (inner.endsWith('%')) return inner
    return parseLength(inner)
  }
  if (raw === 'full') return '100%'
  if (raw === 'px') return 1
  if (raw.includes('/')) {
    const parts = raw.split('/')
    const n = Number.parseFloat(parts[0] ?? '')
    const d = Number.parseFloat(parts[1] ?? '')
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) {
      return `${(n / d) * 100}%`
    }
    return null
  }
  const n = Number.parseFloat(raw)
  if (Number.isFinite(n) && /^-?\d*\.?\d+$/.test(raw)) {
    return n * getBaseUnit()
  }
  // Named token fallback — translate inherits the spacing namespace.
  const tokenName = `--spacing-${raw}`
  const tokenValue = getToken(tokenName)
  if (tokenValue !== undefined) {
    tokensUsed.push(tokenName)
    if (tokenValue.endsWith('%')) return tokenValue
    return parseLength(tokenValue)
  }
  return null
}

function parseScaleValue(raw: string): number | null {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1)
    const n = Number.parseFloat(inner)
    return Number.isFinite(n) ? n : null
  }
  const n = Number.parseFloat(raw)
  if (Number.isFinite(n) && /^-?\d+(?:\.\d+)?$/.test(raw)) return n / 100
  return null
}

function parseAngleValue(raw: string): string | null {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1)
    if (/(?:deg|rad|turn)$/i.test(inner)) return inner
    const n = Number.parseFloat(inner)
    return Number.isFinite(n) ? `${n}deg` : null
  }
  const n = Number.parseFloat(raw)
  if (Number.isFinite(n) && /^-?\d+(?:\.\d+)?$/.test(raw)) return `${n}deg`
  return null
}

function negateNumber(v: number | string): number | string {
  if (typeof v === 'number') return -v
  if (typeof v === 'string') {
    if (v.startsWith('-')) return v.slice(1)
    return `-${v}`
  }
  return v
}

function negateAngle(v: string): string {
  if (v.startsWith('-')) return v.slice(1)
  return `-${v}`
}

export function resolveTransforms(className: string): ResolveResult | null {
  if (className === 'transform-none') {
    return { style: { transform: [] }, tokensUsed: [] }
  }

  let cls = className
  let negative = false
  if (cls.startsWith('-')) {
    negative = true
    cls = cls.slice(1)
  }

  // Translate group — most specific axis prefixes first.
  const tx = matchPrefix(cls, 'translate-x')
  if (tx !== null) {
    if (!tx) return null
    const tokensUsed = ['--spacing']
    const v = parseTranslateValue(tx, tokensUsed)
    if (v === null) return null
    const final = negative ? negateNumber(v) : v
    return {
      style: { transform: [{ translateX: final }] },
      tokensUsed,
    }
  }
  const ty = matchPrefix(cls, 'translate-y')
  if (ty !== null) {
    if (!ty) return null
    const tokensUsed = ['--spacing']
    const v = parseTranslateValue(ty, tokensUsed)
    if (v === null) return null
    const final = negative ? negateNumber(v) : v
    return {
      style: { transform: [{ translateY: final }] },
      tokensUsed,
    }
  }
  const tBoth = matchPrefix(cls, 'translate')
  if (tBoth !== null) {
    if (!tBoth) return null
    const tokensUsed = ['--spacing']
    const v = parseTranslateValue(tBoth, tokensUsed)
    if (v === null) return null
    const final = negative ? negateNumber(v) : v
    return {
      style: { transform: [{ translateX: final }, { translateY: final }] },
      tokensUsed,
    }
  }

  // Rotate group — 3D variants (x/y/z) first, then 2D `rotate`.
  for (const axis of ['x', 'y', 'z'] as const) {
    const r = matchPrefix(cls, `rotate-${axis}`)
    if (r !== null) {
      if (!r) return null
      const v = parseAngleValue(r)
      if (v === null) return null
      const final = negative ? negateAngle(v) : v
      const op: TransformOp = { [`rotate${axis.toUpperCase()}`]: final }
      return { style: { transform: [op] }, tokensUsed: [] }
    }
  }
  const rotate = matchPrefix(cls, 'rotate')
  if (rotate !== null) {
    if (!rotate) return null
    const v = parseAngleValue(rotate)
    if (v === null) return null
    const final = negative ? negateAngle(v) : v
    return { style: { transform: [{ rotate: final }] }, tokensUsed: [] }
  }

  // Scale group.
  for (const axis of ['x', 'y'] as const) {
    const s = matchPrefix(cls, `scale-${axis}`)
    if (s !== null) {
      if (!s) return null
      const v = parseScaleValue(s)
      if (v === null) return null
      const final = negative ? -v : v
      const op: TransformOp = { [`scale${axis.toUpperCase()}`]: final }
      return { style: { transform: [op] }, tokensUsed: [] }
    }
  }
  const scale = matchPrefix(cls, 'scale')
  if (scale !== null) {
    if (!scale) return null
    const v = parseScaleValue(scale)
    if (v === null) return null
    const final = negative ? -v : v
    return { style: { transform: [{ scale: final }] }, tokensUsed: [] }
  }

  // Skew group — RN supports skewX/skewY, no plain `skew`.
  for (const axis of ['x', 'y'] as const) {
    const sk = matchPrefix(cls, `skew-${axis}`)
    if (sk !== null) {
      if (!sk) return null
      const v = parseAngleValue(sk)
      if (v === null) return null
      const final = negative ? negateAngle(v) : v
      const op: TransformOp = { [`skew${axis.toUpperCase()}`]: final }
      return { style: { transform: [op] }, tokensUsed: [] }
    }
  }

  return null
}
