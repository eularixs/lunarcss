// Web runtime — same engine as native.
//
// Why not Tailwind CSS on web?
//   react-native-web's `View` / `Text` / `Pressable` / etc. strip the
//   `className` prop at render time (`forwardedProps.defaultProps` allowlist
//   does not include it). The string never reaches the DOM, so even when
//   Tailwind generates the matching CSS rules nothing applies. Patching
//   RN-Web's allowlist post-load is too late — the View module captures
//   `forwardPropsList` at module init via Object.assign.
//
//   Instead, we run the SAME resolver on web that we run on native: the
//   transformer rewrites `className="..."` to `style={__lcssTw('...')}`,
//   __lcssTw resolves against the lunar.config.ts token registry, and
//   RN-Web's StyleSheet emits atomic CSS classes from the resulting style
//   object. One engine, identical output across platforms, no Tailwind
//   dependency on web.

import type { ResolvedStyle } from './types.js'
import { getCached, setCached } from './cache.js'
import { getRuntimeContext } from './context.js'
import { resolveClassList } from '../resolver/index.js'
import { setTokens } from './tokens.js'
import { THEME_TOKENS } from '@lunar-kit/css/__theme__'

// Boot-time hydration. The transformer-injected `import { __lcssTw } from
// '@lunar-kit/css/runtime'` triggers this on web too — same lifecycle as native.
setTokens(THEME_TOKENS as Record<string, string>)

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
