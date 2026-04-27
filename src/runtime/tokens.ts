export type TokenMap = Record<string, string>

const tokens: TokenMap = {}
let themeHash = 0

export function setTokens(next: TokenMap): void {
  for (const k of Object.keys(next)) {
    const v = next[k]
    if (v !== undefined) tokens[k] = v
  }
  themeHash++
}

export function clearTokens(): void {
  for (const k of Object.keys(tokens)) delete tokens[k]
  themeHash++
}

export function getToken(name: string): string | undefined {
  return tokens[name]
}

export function getAllTokens(): Readonly<TokenMap> {
  return tokens
}

export function getThemeHash(): number {
  return themeHash
}

export function bumpThemeHash(): void {
  themeHash++
}
