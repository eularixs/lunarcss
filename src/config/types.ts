// Types for `lunar.config.ts`. Single source of truth for both mobile (read
// at Metro config time) and web (read at PostCSS build time).

export interface ThemeExtend {
  colors?: Record<string, string>
  spacing?: Record<string, string>
  fontSize?: Record<string, string | [string, string]>
  fontWeight?: Record<string, string>
  fontFamily?: Record<string, string>
  borderRadius?: Record<string, string>
  width?: Record<string, string>
  height?: Record<string, string>
  minWidth?: Record<string, string>
  maxWidth?: Record<string, string>
  minHeight?: Record<string, string>
  maxHeight?: Record<string, string>
  letterSpacing?: Record<string, string>
  lineHeight?: Record<string, string>
}

export interface LunarConfig {
  theme?: {
    extend?: ThemeExtend
    // Escape hatch: flat token map (`--color-foo`, `--spacing-xs` etc.)
    tokens?: Record<string, string>
  }
  tailwindVersion?: 3 | 4
  runtime?: { cacheSize?: number }
  extract?: {
    components?: readonly string[]
    helpers?: readonly string[]
  }
}

export type FlatTokens = Record<string, string>
