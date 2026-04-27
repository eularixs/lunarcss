// Native / default entry. Auto-init the RN bridge + load tokens emitted by
// `withLunarCSS()` from the user's `lunar.config.ts`.
import { initNativeBridge } from './runtime/native-bridge.js'
import { setTokens } from './runtime/tokens.js'
import { THEME_TOKENS } from 'lunarcss/__theme__'

initNativeBridge()
setTokens(THEME_TOKENS as Record<string, string>)

export { __lcssTw, tw } from './runtime/tw.js'
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
