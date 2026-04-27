import type { FlatTokens, LunarConfig, ThemeExtend } from './types.js'

// Map a `theme.extend.<namespace>` key to its CSS custom-property prefix.
// Mirrors Tailwind v4 token namespaces.
const NAMESPACE_PREFIX: Readonly<Record<keyof ThemeExtend, string>> = {
  colors: '--color',
  spacing: '--spacing',
  fontSize: '--text',
  fontWeight: '--font-weight',
  fontFamily: '--font-family',
  borderRadius: '--radius',
  width: '--width',
  height: '--height',
  minWidth: '--min-width',
  maxWidth: '--max-width',
  minHeight: '--min-height',
  maxHeight: '--max-height',
  letterSpacing: '--tracking',
  lineHeight: '--leading',
}

export function flattenTokens(config: LunarConfig | undefined | null): FlatTokens {
  const out: FlatTokens = {}
  if (!config?.theme) return out

  const extend = config.theme.extend
  if (extend) {
    for (const ns of Object.keys(extend) as Array<keyof ThemeExtend>) {
      const prefix = NAMESPACE_PREFIX[ns]
      const group = extend[ns]
      if (!group || !prefix) continue
      for (const name of Object.keys(group)) {
        const raw = group[name]
        if (raw === undefined) continue
        if (Array.isArray(raw)) {
          // fontSize tuple: [size, lineHeight]
          const [size, lh] = raw
          if (typeof size === 'string') out[`${prefix}-${name}`] = size
          if (typeof lh === 'string') out[`${prefix}-${name}--line-height`] = lh
        } else if (typeof raw === 'string') {
          out[`${prefix}-${name}`] = raw
        }
      }
    }
  }

  // Flat escape hatch overrides namespaced values (last write wins).
  const tokens = config.theme.tokens
  if (tokens) {
    for (const k of Object.keys(tokens)) {
      const v = tokens[k]
      if (typeof v === 'string') out[k] = v
    }
  }

  return out
}
