import type { RuntimeContext } from '../runtime/types.js'
import { resolveClassList as resolveV4 } from './v4/index.js'

export type ResolverVersion = 3 | 4

let activeVersion: ResolverVersion = 4

export function setResolverVersion(version: ResolverVersion): void {
  activeVersion = version
}

export function getResolverVersion(): ResolverVersion {
  return activeVersion
}

export function resolveClassList(classList: string, ctx: RuntimeContext) {
  // v3 fallback path is reserved for future TWRNC-based resolver.
  return resolveV4(classList, ctx)
}

export { parseTheme } from './v4/index.js'
