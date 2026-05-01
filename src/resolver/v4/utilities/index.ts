import type { ResolveResult } from '../../../runtime/types.js'
import { resolveSpacing } from './spacing.js'
import { resolveColor } from './colors.js'
import { resolveLayout } from './layout.js'
import { resolveSizing } from './sizing.js'
import { resolveTypography } from './typography.js'
import { resolveBorders } from './borders.js'
import { resolveEffects } from './effects.js'
import { resolveTransforms } from './transforms.js'
import { resolveTransitions } from './transitions.js'
import { resolveContainers } from './containers.js'

type UtilityResolver = (className: string) => ResolveResult | null

// Order matters: layout (static map) first for O(1) hits, then typography
// (also static-heavy). Effects + borders before colors so `shadow-md` /
// `border-2` win over color resolver's `shadow-{color}` / `border-{color}`.
const RESOLVERS: readonly UtilityResolver[] = [
  resolveContainers,
  resolveLayout,
  resolveTypography,
  resolveTransitions,
  resolveTransforms,
  resolveEffects,
  resolveBorders,
  resolveColor,
  resolveSizing,
  resolveSpacing,
]

export function resolveUtility(className: string): ResolveResult | null {
  for (const fn of RESOLVERS) {
    const result = fn(className)
    if (result !== null) return result
  }
  return null
}
