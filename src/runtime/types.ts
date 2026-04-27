export type StyleValue = string | number | StyleObjectValue | TransformOp[]

export interface StyleObjectValue {
  width?: number
  height?: number
  [k: string]: unknown
}

export interface TransformOp {
  [k: string]: number | string
}

export type ResolvedStyle = Record<string, StyleValue>

export interface ResolveResult {
  style: ResolvedStyle
  tokensUsed: string[]
}

export type Platform = 'ios' | 'android' | 'web'
export type ColorScheme = 'light' | 'dark'
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface RuntimeContext {
  platform: Platform
  colorScheme: ColorScheme
  width: number
  state: {
    active?: boolean
    disabled?: boolean
    focus?: boolean
    pressed?: boolean
    hover?: boolean
  }
}
