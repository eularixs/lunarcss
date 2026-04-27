// Web entry: passthrough only, zero RN dependency.
export { __lcssTw, tw } from './runtime/tw.web.js'

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
