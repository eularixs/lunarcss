// Web entry: passthrough only, zero RN dependency. __lcssTw returns {} on
// web — Tailwind matches the original className on the DOM directly. Same
// public surface as the native entry so cross-platform code compiles.
export { __lcssTw, tw } from './runtime/tw.web.js'
export { styledComponent } from './runtime/styled.js'
export type { ClassNameProps, StyledOptions } from './runtime/styled.js'
export { useLunarCSS } from './runtime/use-lunar-css.js'
export type { LunarCSS } from './runtime/use-lunar-css.js'
export { vars, lunarTheme, resolveToken } from './runtime/vars.js'
export { isWeb } from './runtime/platform-detect.js'

export interface DefineConfigInput {
  theme?: {
    extend?: Record<string, Record<string, string>>
  }
  tailwindVersion?: 3 | 4
  runtime?: { cacheSize?: number }
  extract?: {
    components?: readonly string[]
    helpers?: readonly string[]
  }
}

export function defineConfig(config: DefineConfigInput): DefineConfigInput {
  return config
}
