import type { ResolvedStyle } from './types.js'
import { getThemeHash } from './tokens.js'

const DEFAULT_MAX = 1000

class LRU<K, V> {
  private map = new Map<K, V>()
  constructor(private max: number) {}

  get(key: K): V | undefined {
    const v = this.map.get(key)
    if (v === undefined) return undefined
    this.map.delete(key)
    this.map.set(key, v)
    return v
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key)
    else if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value
      if (oldest !== undefined) this.map.delete(oldest)
    }
    this.map.set(key, value)
  }

  delete(key: K): boolean {
    return this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }

  setMax(max: number): void {
    this.max = max
    while (this.map.size > max) {
      const oldest = this.map.keys().next().value
      if (oldest === undefined) break
      this.map.delete(oldest)
    }
  }
}

const styleCache = new LRU<string, ResolvedStyle>(DEFAULT_MAX)
const tokenIndex = new Map<string, Set<string>>()

export function makeKey(className: string): string {
  return `${className}::${getThemeHash()}`
}

export function getCached(className: string): ResolvedStyle | undefined {
  return styleCache.get(makeKey(className))
}

export function setCached(
  className: string,
  style: ResolvedStyle,
  tokensUsed: readonly string[],
): void {
  const key = makeKey(className)
  styleCache.set(key, style)
  for (const t of tokensUsed) {
    let set = tokenIndex.get(t)
    if (!set) {
      set = new Set()
      tokenIndex.set(t, set)
    }
    set.add(key)
  }
}

export function invalidateTokens(tokens: readonly string[]): void {
  for (const t of tokens) {
    const keys = tokenIndex.get(t)
    if (!keys) continue
    for (const k of keys) styleCache.delete(k)
    tokenIndex.delete(t)
  }
}

export function clearCache(): void {
  styleCache.clear()
  tokenIndex.clear()
}

export function configureCache(max: number): void {
  styleCache.setMax(max)
}
