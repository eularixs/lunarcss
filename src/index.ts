// Native / default entry. Re-exports the public API. Boot-time hydration
// (initNativeBridge + setTokens(THEME_TOKENS)) lives in ./runtime/tw.ts so
// transformer-injected `import { __lcssTw } from '@lunar-kit/css/runtime'` triggers
// it on its own — user apps don't need to import the root entry.
export { __lcssTw, tw } from './runtime/tw.js'
export { styledComponent } from './runtime/styled.js'
export type { ClassNameProps, StyledOptions } from './runtime/styled.js'
export { useLunarCSS } from './runtime/use-lunar-css.js'
export type { LunarCSS } from './runtime/use-lunar-css.js'
export { vars, lunarTheme, resolveToken } from './runtime/vars.js'
export { isWeb } from './runtime/platform-detect.js'
export { updateTheme, subscribeTheme } from './runtime/theme.js'
export { setTokens, clearTokens, getToken, getAllTokens } from './runtime/tokens.js'
export { configureCache, clearCache } from './runtime/cache.js'
export { setRuntimeContextProvider, getRuntimeContext } from './runtime/context.js'
export { parseTheme, resolveClassList, setResolverVersion, getResolverVersion } from './resolver/index.js'
export type {
  ResolvedStyle,
  ResolveResult,
  RuntimeContext,
  Platform,
  ColorScheme,
  Breakpoint,
  StyleValue,
} from './runtime/types.js'

export interface DefineConfigInput {
  theme?: {
    extend?: Record<string, Record<string, string>>
  }
  tailwindVersion?: 3 | 4
  runtime?: {
    cacheSize?: number
  }
  extract?: {
    components?: readonly string[]
    helpers?: readonly string[]
  }
}

export function defineConfig(config: DefineConfigInput): DefineConfigInput {
  return config
}
