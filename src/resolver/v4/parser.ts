// Minimal @theme block parser. Subset only: flat `--token: value;` decls.
// Reject nested rules, @media, @supports. See Risk Mitigation #15.

const COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g
const THEME_PATTERN = /@theme\s*\{([^}]*)\}/g

export interface ParsedTheme {
  tokens: Record<string, string>
  errors: string[]
}

export function parseTheme(css: string): ParsedTheme {
  const tokens: Record<string, string> = {}
  const errors: string[] = []
  const stripped = css.replace(COMMENT_PATTERN, '')

  for (const match of stripped.matchAll(THEME_PATTERN)) {
    const body = match[1] ?? ''
    for (const rawDecl of body.split(';')) {
      const decl = rawDecl.trim()
      if (!decl) continue

      const colonIdx = decl.indexOf(':')
      if (colonIdx === -1) {
        errors.push(`Malformed declaration: "${decl}"`)
        continue
      }

      const key = decl.slice(0, colonIdx).trim()
      const value = decl.slice(colonIdx + 1).trim()

      if (!key.startsWith('--')) {
        errors.push(`Non-custom-property in @theme: "${key}"`)
        continue
      }
      if (!value) {
        errors.push(`Empty value for "${key}"`)
        continue
      }
      tokens[key] = value
    }
  }
  return { tokens, errors }
}
