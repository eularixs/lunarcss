import type { ResolveResult, ResolvedStyle, RuntimeContext } from '../../runtime/types.js'
import { parseModifiers, modifiersMatch } from '../../runtime/platform.js'
import { resolveUtility } from './utilities/index.js'
import { applyLeadingMultiplier } from './utilities/typography.js'

export interface V4ResolveResult {
  style: ResolvedStyle
  tokensUsed: string[]
}

export function resolveClassList(
  classList: string,
  ctx: RuntimeContext,
): V4ResolveResult {
  const merged: ResolvedStyle = {}
  const tokensUsed: string[] = []
  const seenTokens = new Set<string>()

  for (const raw of classList.split(/\s+/)) {
    const cls = raw.trim()
    if (!cls) continue

    const { modifiers, base } = parseModifiers(cls)
    if (!modifiersMatch(modifiers, ctx)) continue

    const result: ResolveResult | null = resolveUtility(base)
    if (!result) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[LunarCSS] Unrecognized class "${cls}"`)
      }
      continue
    }

    for (const key of Object.keys(result.style)) {
      const incoming = result.style[key]
      if (key === 'transform' && Array.isArray(incoming)) {
        const existing = merged.transform
        if (Array.isArray(existing)) {
          merged.transform = [...existing, ...incoming]
        } else {
          merged.transform = [...incoming]
        }
        continue
      }
      merged[key] = incoming as never
    }
    for (const t of result.tokensUsed) {
      if (!seenTokens.has(t)) {
        seenTokens.add(t)
        tokensUsed.push(t)
      }
    }
  }

  applyLeadingMultiplier(merged)
  return { style: merged, tokensUsed }
}

export { parseTheme } from './parser.js'
