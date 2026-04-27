import { oklch, formatHex, clampChroma, parse as parseColor, rgb } from 'culori'
import type { ResolveResult, ResolvedStyle } from '../../../runtime/types.js'
import { getToken } from '../../../runtime/tokens.js'
import { NAMED_COLORS } from './colors-keywords.js'

const colorMemo = new Map<string, string>()

export function isOklch(value: string): boolean {
  return /^oklch\s*\(/i.test(value.trim())
}

export function isOutOfSRGBGamut(value: string): boolean {
  const c = oklch(value)
  if (!c) return false
  const clamped = clampChroma(c, 'oklch')
  if (!clamped) return false
  const orig = c.c ?? 0
  const cl = clamped.c ?? 0
  return Math.abs(orig - cl) > 0.001
}

export function toRNColor(value: string): string {
  const cached = colorMemo.get(value)
  if (cached !== undefined) return cached

  const trimmed = value.trim()
  let result = trimmed

  if (isOklch(trimmed)) {
    const parsed = oklch(trimmed)
    if (parsed) {
      const clamped = clampChroma(parsed, 'oklch')
      const hex = formatHex(clamped ?? parsed)
      if (hex) {
        if (process.env.NODE_ENV !== 'production' && isOutOfSRGBGamut(trimmed)) {
          console.warn(
            `[LunarCSS] Color "${trimmed}" is outside sRGB gamut and has been clamped to "${hex}" on mobile. ` +
              `Provide a hex fallback for precise mobile color.`,
          )
        }
        result = hex
      }
    }
  } else {
    const parsed = parseColor(trimmed)
    if (parsed) {
      const hex = formatHex(parsed)
      if (hex) result = hex
    }
  }

  colorMemo.set(value, result)
  return result
}

// Apply alpha (0-1) to a color value. For hex returns 8-digit hex.
export function applyAlpha(color: string, alpha: number): string {
  if (alpha >= 1) return color
  if (alpha <= 0) return 'transparent'

  if (color === 'transparent' || color === 'currentColor' || color === 'inherit') {
    return color
  }

  const parsed = parseColor(color)
  if (!parsed) return color
  const r = rgb(parsed)
  if (!r) return color
  const cr = Math.round((r.r ?? 0) * 255)
  const cg = Math.round((r.g ?? 0) * 255)
  const cb = Math.round((r.b ?? 0) * 255)
  const a = Math.max(0, Math.min(1, alpha))
  return `rgba(${cr},${cg},${cb},${a})`
}

interface ColorPrefix {
  prefix: string
  keys: readonly string[]
}

const COLOR_PREFIXES: readonly ColorPrefix[] = [
  { prefix: 'bg', keys: ['backgroundColor'] },
  { prefix: 'text', keys: ['color'] },
  { prefix: 'border', keys: ['borderColor'] },
  { prefix: 'ring', keys: ['shadowColor'] },
  { prefix: 'shadow', keys: ['shadowColor'] },
  { prefix: 'tint', keys: ['tintColor'] },
  { prefix: 'placeholder', keys: ['placeholderTextColor'] },
]

function splitOpacity(value: string): { value: string; alpha: number | null } {
  // Find last `/` not inside brackets
  let depth = 0
  let slashAt = -1
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '[') depth++
    else if (ch === ']') depth--
    else if (ch === '/' && depth === 0) slashAt = i
  }
  if (slashAt === -1) return { value, alpha: null }

  const head = value.slice(0, slashAt)
  const tail = value.slice(slashAt + 1)
  const num = Number.parseFloat(tail)
  if (!Number.isFinite(num)) return { value, alpha: null }
  return { value: head, alpha: num > 1 ? num / 100 : num }
}

function resolveColorValue(
  raw: string,
  tokensUsed: string[],
): string | null {
  // Arbitrary value
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return toRNColor(raw.slice(1, -1))
  }

  // CSS named
  if (raw in NAMED_COLORS) {
    return NAMED_COLORS[raw] as string
  }

  // Token chain: --color-<raw> first; then --color-<raw>-DEFAULT not used in v4 spec
  const tokenName = `--color-${raw}`
  const tokenValue = getToken(tokenName)
  if (tokenValue !== undefined) {
    tokensUsed.push(tokenName)
    return toRNColor(tokenValue)
  }

  return null
}

export function resolveColor(className: string): ResolveResult | null {
  for (const { prefix, keys } of COLOR_PREFIXES) {
    if (!className.startsWith(`${prefix}-`)) continue
    const rest = className.slice(prefix.length + 1)
    if (!rest) continue

    // Border can also be a width (`border-2`) — only treat as color when value
    // resolves to a known color; otherwise let other resolvers handle it.
    const { value, alpha } = splitOpacity(rest)
    const tokensUsed: string[] = []
    const color = resolveColorValue(value, tokensUsed)
    if (color === null) continue

    const final = alpha !== null ? applyAlpha(color, alpha) : color
    const style: ResolvedStyle = {}
    for (const k of keys) style[k] = final
    return { style, tokensUsed }
  }
  return null
}
