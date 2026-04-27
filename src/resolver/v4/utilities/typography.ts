import type { ResolveResult, ResolvedStyle } from '../../../runtime/types.js'
import { getToken } from '../../../runtime/tokens.js'
import { parseLength } from './length.js'

// Tailwind v4 default text scale. fontSize → lineHeight pair.
const TEXT_SCALE: Readonly<Record<string, [number, number]>> = {
  xs: [12, 16],
  sm: [14, 20],
  base: [16, 24],
  lg: [18, 28],
  xl: [20, 28],
  '2xl': [24, 32],
  '3xl': [30, 36],
  '4xl': [36, 40],
  '5xl': [48, 48],
  '6xl': [60, 60],
  '7xl': [72, 72],
  '8xl': [96, 96],
  '9xl': [128, 128],
}

const FONT_WEIGHTS: Readonly<Record<string, string>> = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
}

// Named line-height multipliers (relative). RN needs absolute, so without
// fontSize context we cannot produce the right value. We emit the multiplier
// and the resolver post-processes when fontSize is known.
const LEADING_MULTIPLIERS: Readonly<Record<string, number>> = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
}

// letterSpacing — Tailwind values are em-based; convert with 16px baseline as
// a documented approximation (Risk doc note in Effects).
const TRACKING_EM: Readonly<Record<string, number>> = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
}
const TRACKING_BASE_PX = 16

const STATIC: Readonly<Record<string, ResolvedStyle>> = {
  // text alignment
  'text-left': { textAlign: 'left' },
  'text-center': { textAlign: 'center' },
  'text-right': { textAlign: 'right' },
  'text-justify': { textAlign: 'justify' },

  // font style
  italic: { fontStyle: 'italic' },
  'not-italic': { fontStyle: 'normal' },

  // text decoration line
  underline: { textDecorationLine: 'underline' },
  'line-through': { textDecorationLine: 'line-through' },
  'no-underline': { textDecorationLine: 'none' },

  // text transform
  uppercase: { textTransform: 'uppercase' },
  lowercase: { textTransform: 'lowercase' },
  capitalize: { textTransform: 'capitalize' },
  'normal-case': { textTransform: 'none' },
}

const DEFAULT_BASE_UNIT = 4
function getBaseUnit(): number {
  const v = getToken('--spacing')
  if (v === undefined) return DEFAULT_BASE_UNIT
  return parseLength(v) ?? DEFAULT_BASE_UNIT
}

function resolveText(rest: string, tokensUsed: string[]): ResolvedStyle | null {
  // Token first: --text-{name} (and optional --text-{name}--line-height)
  const sizeToken = getToken(`--text-${rest}`)
  if (sizeToken !== undefined) {
    tokensUsed.push(`--text-${rest}`)
    const lhTokenKey = `--text-${rest}--line-height`
    const lhToken = getToken(lhTokenKey)
    const fs = parseLength(sizeToken)
    if (fs === null) return null
    const out: ResolvedStyle = { fontSize: fs }
    if (lhToken !== undefined) {
      tokensUsed.push(lhTokenKey)
      const lh = parseLength(lhToken)
      if (lh !== null) out.lineHeight = lh
    }
    return out
  }

  const scale = TEXT_SCALE[rest]
  if (scale) {
    return { fontSize: scale[0], lineHeight: scale[1] }
  }

  // arbitrary text-[18px]
  if (rest.startsWith('[') && rest.endsWith(']')) {
    const inner = rest.slice(1, -1)
    const n = parseLength(inner)
    if (n !== null) return { fontSize: n }
  }

  return null
}

function resolveFont(rest: string, _tokensUsed: string[]): ResolvedStyle | null {
  const w = FONT_WEIGHTS[rest]
  if (w) return { fontWeight: w }

  if (rest.startsWith('[') && rest.endsWith(']')) {
    const inner = rest.slice(1, -1)
    return { fontFamily: inner }
  }
  return null
}

function resolveLeading(rest: string, tokensUsed: string[]): ResolvedStyle | null {
  if (rest.startsWith('[') && rest.endsWith(']')) {
    const n = parseLength(rest.slice(1, -1))
    if (n !== null) return { lineHeight: n }
    return null
  }
  const mult = LEADING_MULTIPLIERS[rest]
  if (mult !== undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[LunarCSS] "leading-${rest}" emits a multiplier; on React Native lineHeight is absolute. ` +
          `Combine with text-* in the same className for an automatic computed value.`,
      )
    }
    // Encode as multiplier marker via string; resolver post-process catches it.
    return { __leadingMultiplier: mult } as ResolvedStyle
  }
  const num = Number.parseFloat(rest)
  if (Number.isFinite(num) && /^-?\d*\.?\d+$/.test(rest)) {
    tokensUsed.push('--spacing')
    return { lineHeight: num * getBaseUnit() }
  }
  return null
}

function resolveTracking(rest: string, _tokensUsed: string[]): ResolvedStyle | null {
  if (rest.startsWith('[') && rest.endsWith(']')) {
    const n = parseLength(rest.slice(1, -1))
    if (n !== null) return { letterSpacing: n }
    return null
  }
  const em = TRACKING_EM[rest]
  if (em !== undefined) return { letterSpacing: em * TRACKING_BASE_PX }
  return null
}

export function resolveTypography(className: string): ResolveResult | null {
  const stat = STATIC[className]
  if (stat) return { style: { ...stat }, tokensUsed: [] }

  const groups: ReadonlyArray<[string, (rest: string, t: string[]) => ResolvedStyle | null]> = [
    ['text-', resolveText],
    ['font-', resolveFont],
    ['leading-', resolveLeading],
    ['tracking-', resolveTracking],
  ]

  for (const [prefix, fn] of groups) {
    if (!className.startsWith(prefix)) continue
    const rest = className.slice(prefix.length)
    if (!rest) continue
    const tokensUsed: string[] = []
    const style = fn(rest, tokensUsed)
    if (style) return { style, tokensUsed }
  }

  return null
}

// Post-process pass: if `__leadingMultiplier` marker exists alongside fontSize,
// convert to absolute lineHeight.
export function applyLeadingMultiplier(style: ResolvedStyle): void {
  const mult = style.__leadingMultiplier
  if (typeof mult !== 'number') return
  delete style.__leadingMultiplier
  if (typeof style.fontSize === 'number') {
    style.lineHeight = style.fontSize * mult
  }
}
