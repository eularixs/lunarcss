import type { ResolveResult, ResolvedStyle } from '../../../runtime/types.js'

const OPACITY_SCALE: Readonly<Record<string, number>> = {
  '0': 0,
  '5': 0.05,
  '10': 0.1,
  '15': 0.15,
  '20': 0.2,
  '25': 0.25,
  '30': 0.3,
  '35': 0.35,
  '40': 0.4,
  '45': 0.45,
  '50': 0.5,
  '55': 0.55,
  '60': 0.6,
  '65': 0.65,
  '70': 0.7,
  '75': 0.75,
  '80': 0.8,
  '85': 0.85,
  '90': 0.9,
  '95': 0.95,
  '100': 1,
}

// React Native shadow approximations of Tailwind v4's box-shadow scale.
// Includes Android `elevation` so dropping a class on a `<View>` works on both
// platforms without extra boilerplate.
const SHADOW_SCALE: Readonly<Record<string, ResolvedStyle>> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // bare `shadow` and `shadow-md` use the same default
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 12,
  },
}

export function resolveEffects(className: string): ResolveResult | null {
  // opacity
  if (className === 'opacity') return null
  if (className.startsWith('opacity-')) {
    const rest = className.slice('opacity-'.length)
    if (rest.startsWith('[') && rest.endsWith(']')) {
      const inner = rest.slice(1, -1)
      const n = Number.parseFloat(inner)
      if (Number.isFinite(n)) return { style: { opacity: n }, tokensUsed: [] }
      return null
    }
    const v = OPACITY_SCALE[rest]
    if (v !== undefined) return { style: { opacity: v }, tokensUsed: [] }
    return null
  }

  // shadow size scale (must beat colors fallback for these specific keys)
  if (className === 'shadow') {
    return { style: { ...(SHADOW_SCALE.md as ResolvedStyle) }, tokensUsed: [] }
  }
  if (className.startsWith('shadow-')) {
    const rest = className.slice('shadow-'.length)
    const preset = SHADOW_SCALE[rest]
    if (preset) return { style: { ...preset }, tokensUsed: [] }
    // not a size token — let color resolver handle it
    return null
  }

  return null
}
