import type { Platform, ColorScheme, Breakpoint, RuntimeContext } from './types.js'

const PLATFORM_MODS = new Set(['ios', 'android', 'web'])
const SCHEME_MODS = new Set(['dark', 'light'])
const STATE_MODS = new Set(['active', 'disabled', 'focus', 'pressed', 'hover'])
const RESPONSIVE_MODS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export interface ParsedClass {
  modifiers: string[]
  base: string
}

export function parseModifiers(className: string): ParsedClass {
  const parts = className.split(':')
  const base = parts[parts.length - 1] ?? ''
  const modifiers = parts.slice(0, -1)
  return { modifiers, base }
}

export function modifiersMatch(modifiers: readonly string[], ctx: RuntimeContext): boolean {
  for (const m of modifiers) {
    if (PLATFORM_MODS.has(m)) {
      if ((m as Platform) !== ctx.platform) return false
      continue
    }
    if (SCHEME_MODS.has(m)) {
      if ((m as ColorScheme) !== ctx.colorScheme) return false
      continue
    }
    if (STATE_MODS.has(m)) {
      const stateKey = m as keyof RuntimeContext['state']
      if (!ctx.state[stateKey]) return false
      continue
    }
    if (m in RESPONSIVE_MODS) {
      const min = RESPONSIVE_MODS[m as Breakpoint]
      if (ctx.width < min) return false
      continue
    }
    // Unknown modifier: fail closed in dev, ignore in prod
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[LunarCSS] Unknown modifier "${m}"`)
    }
    return false
  }
  return true
}
