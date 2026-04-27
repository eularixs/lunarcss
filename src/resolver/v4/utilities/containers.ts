import type { ResolveResult } from '../../../runtime/types.js'

// Tailwind v4 container queries are a CSS-only feature. React Native has no
// equivalent — `@container`, `@container-normal`, `@container-size` are
// silently consumed on mobile so the class can stay in the className string
// without producing a "unrecognized class" warning.
//
// Web path: tw.web.ts is a passthrough. Browser CSS handles all container-
// query semantics directly via Tailwind's compiled output. Nothing here runs
// on web.
//
// See Risk Mitigation #16 — RN unsupported v4 props.

const NOOP_CLASSES: ReadonlySet<string> = new Set([
  '@container',
  '@container-normal',
  '@container-size',
])

export function resolveContainers(className: string): ResolveResult | null {
  if (NOOP_CLASSES.has(className)) {
    return { style: {}, tokensUsed: [] }
  }
  // `@container/name` — named container declaration (CSS only).
  if (className.startsWith('@container/')) {
    return { style: {}, tokensUsed: [] }
  }
  return null
}
