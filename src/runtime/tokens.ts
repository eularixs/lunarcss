export type TokenMap = Record<string, string>

// tsup builds each entry (index.js, runtime/tw.js, ...) without code splitting,
// so a top-level `const tokens = {}` produces a SEPARATE registry per entry.
// The transformer-injected `import '@lunar-kit/css/runtime'` would then hydrate the
// runtime/tw.js copy while consumer-facing getToken/getAllTokens (re-exported
// from index.js) read a different empty copy. Pin to globalThis so all bundle
// copies share the same Map.
interface LunarGlobal {
  tokens: TokenMap
  themeHash: number
}
const GLOBAL_KEY = '__LUNARCSS_RUNTIME__'
const g = globalThis as unknown as Record<string, LunarGlobal | undefined>
const state: LunarGlobal = (g[GLOBAL_KEY] ??= { tokens: {}, themeHash: 0 })
const tokens: TokenMap = state.tokens

export function setTokens(next: TokenMap): void {
  for (const k of Object.keys(next)) {
    const v = next[k]
    if (v !== undefined) tokens[k] = v
  }
  state.themeHash++
}

export function clearTokens(): void {
  for (const k of Object.keys(tokens)) delete tokens[k]
  state.themeHash++
}

export function getToken(name: string): string | undefined {
  return tokens[name]
}

export function getAllTokens(): Readonly<TokenMap> {
  return tokens
}

export function getThemeHash(): number {
  return state.themeHash
}

export function bumpThemeHash(): void {
  state.themeHash++
}
