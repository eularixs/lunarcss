import type { ResolvedStyle } from './types.js'
import { getCached, setCached } from './cache.js'
import { getRuntimeContext } from './context.js'
import { resolveClassList } from '../resolver/index.js'

export function __lcssTw(className: string): ResolvedStyle {
  if (!className) return {}

  const cached = getCached(className)
  if (cached !== undefined) return cached

  const ctx = getRuntimeContext()
  const { style, tokensUsed } = resolveClassList(className, ctx)
  setCached(className, style, tokensUsed)
  return style
}

export function tw(className: string): ResolvedStyle {
  return __lcssTw(className)
}
