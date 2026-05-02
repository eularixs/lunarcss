import type { ResolvedStyle } from './types.js'
import { getCached, setCached } from './cache.js'
import { getRuntimeContext } from './context.js'
import { resolveClassList } from '../resolver/index.js'
import { replaceTokens } from './tokens.js'
import { initNativeBridge } from './native-bridge.js'
import { THEME_TOKENS } from '@lunar-kit/css/__theme__'

// Boot-time hydration. The Metro transformer rewrites `<View className="..."/>`
// into `<View style={__lcssTw(...)}/>` and injects `import { __lcssTw } from
// '@lunar-kit/css/runtime'`. User code never imports the `lunarcss` root entry, so
// hydration must happen here — otherwise the token registry stays empty and
// every token-based class (bg-primary, p-card, rounded-card, ...) resolves to
// `{}`, while arbitrary classes (bg-[#10b981]) still work because they bypass
// getToken.
//
// We use replaceTokens (not setTokens) so Metro hot-reload of lunar.config.ts
// fully reflects the new map — including deletions. Fast Refresh re-runs this
// module body when '@lunar-kit/css/__theme__' updates; replaceTokens wipes
// stale keys, sets new ones, bumps the theme hash to invalidate the LRU.
initNativeBridge()
replaceTokens(THEME_TOKENS as Record<string, string>)

export function __lcssTw(className: string): ResolvedStyle {
  if (!className) return {}

  const cached = getCached(className)
  if (cached !== undefined) return cached

  const ctx = getRuntimeContext()
  const { style, tokensUsed } = resolveClassList(className, ctx)
  setCached(className, style, tokensUsed)
  return style
}

export function tw(className: string): ResolvedStyle {
  return __lcssTw(className)
}
