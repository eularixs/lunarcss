// `vars` — token-name to value Proxy bound to the global token registry.
// Reading `vars.primary` returns getToken('--color-primary') (with a fallback
// chain for spacing/radius/text). The lookup hits the same
// globalThis.__LUNARCSS_RUNTIME__ registry the resolver uses, so values stay
// in sync across web and native.
//
// `lunarTheme()` is a small mapper for the common "give me an object whose
// values are token strings" use case — e.g. React Navigation themes.

import { getToken, getAllTokens } from './tokens.js'

const NAMESPACES = ['color', 'spacing', 'radius', 'text', 'width'] as const

// Resolve a bare token name (e.g. "primary") against known namespaces in
// order. First hit wins. Pass an explicit CSS variable name (starting
// with `--`) to bypass namespace probing.
export function resolveToken(name: string): string | undefined {
  if (name.startsWith('--')) return getToken(name)
  for (const ns of NAMESPACES) {
    const v = getToken(`--${ns}-${name}`)
    if (v !== undefined) return v
  }
  return undefined
}

// Proxy: vars.primary → resolveToken('primary').
// Plain object access — stays in sync with setTokens calls.
export const vars: Readonly<Record<string, string | undefined>> = new Proxy(
  Object.create(null) as Record<string, string | undefined>,
  {
    get(_target, key) {
      if (typeof key !== 'string') return undefined
      return resolveToken(key)
    },
    has(_target, key) {
      if (typeof key !== 'string') return false
      return resolveToken(key) !== undefined
    },
    ownKeys() {
      const all = getAllTokens()
      const seen = new Set<string>()
      for (const k of Object.keys(all)) {
        const m = /^--(?:color|spacing|radius|text|width)-(.+)$/.exec(k)
        if (m && m[1]) seen.add(m[1])
      }
      return [...seen]
    },
    getOwnPropertyDescriptor(_target, key) {
      if (typeof key !== 'string') return undefined
      const v = resolveToken(key)
      if (v === undefined) return undefined
      return { configurable: true, enumerable: true, value: v, writable: false }
    },
  },
)

// Map { logicalName: tokenSpec } to { logicalName: resolvedValue }.
// `tokenSpec` is either a fully-qualified `--<ns>-<name>` or a bare name
// resolved via resolveToken().
export function lunarTheme<K extends string>(
  spec: Readonly<Record<K, string>>,
): Record<K, string | undefined> {
  const out = {} as Record<K, string | undefined>
  for (const k of Object.keys(spec) as K[]) {
    out[k] = resolveToken(spec[k])
  }
  return out
}
