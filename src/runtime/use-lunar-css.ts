// React hook for non-className contexts. Returns:
//   - `tw(classes)` — same engine as the transformer-injected __lcssTw, useful
//     for variables you can't pass through JSX `className` (StatusBar bg, etc).
//   - `token(name)` — direct token lookup. Pass `--color-primary` for an
//     explicit var, or a bare name (e.g. 'primary') for namespace-resolved
//     lookup via resolveToken (color → spacing → radius → text → width).
//
// Implementation note: this hook intentionally does NOT subscribe to
// theme-change events. Token mutations between renders are handled by the
// resolver's own theme-hash invalidation (see runtime/cache.ts). Adding a
// useState/useSyncExternalStore here would force a re-render on EVERY
// mounted component when setTokens fires, which is wasteful — RN apps that
// hot-swap themes should call subscribeTheme() explicitly.

import { __lcssTw } from './tw.js'
import type { ResolvedStyle } from './types.js'
import { resolveToken } from './vars.js'

export interface LunarCSS {
  tw: (classes: string) => ResolvedStyle
  token: (name: string) => string | undefined
}

const SINGLETON: LunarCSS = {
  tw: (classes: string) => __lcssTw(classes),
  token: resolveToken,
}

export function useLunarCSS(): LunarCSS {
  return SINGLETON
}
