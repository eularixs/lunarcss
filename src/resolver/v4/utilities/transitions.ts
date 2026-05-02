// CSS-style transition utilities. The output style keys match the RN web
// (react-native-web) names: `transitionProperty`, `transitionDuration`,
// `transitionDelay`, `transitionTimingFunction`. These keys are silently
// ignored by core React Native components (View/Text/etc) — the MVP
// deliberately does NOT animate on native. Native consumers wanting real
// animation should drive their own `Animated`/Reanimated values; we simply
// preserve the user's intent in the style object.
//
// Out of scope for MVP:
//   - keyframe-style `animate-*` (spin, ping, pulse, bounce)
//   - transition shorthand combining property+duration+ease in one rule

import type { ResolveResult } from '../../../runtime/types.js'

const TRANSITION_GROUPS: Readonly<Record<string, readonly string[]>> = {
  transition: [
    'color',
    'background-color',
    'border-color',
    'text-decoration-color',
    'fill',
    'stroke',
    'opacity',
    'box-shadow',
    'transform',
    'filter',
    'backdrop-filter',
  ],
  'transition-all': ['all'],
  'transition-none': ['none'],
  'transition-colors': [
    'color',
    'background-color',
    'border-color',
    'text-decoration-color',
    'fill',
    'stroke',
  ],
  'transition-opacity': ['opacity'],
  'transition-shadow': ['box-shadow'],
  'transition-transform': ['transform'],
}

const DEFAULT_DURATION_MS = 150
const DEFAULT_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const NAMED_EASE: Readonly<Record<string, string>> = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  initial: 'initial',
}

function parseMs(rest: string): number | null {
  // Arbitrary [200ms] / [0.3s]
  if (rest.startsWith('[') && rest.endsWith(']')) {
    const inner = rest.slice(1, -1).trim()
    if (inner.endsWith('ms')) {
      const n = Number.parseFloat(inner.slice(0, -2))
      return Number.isFinite(n) ? n : null
    }
    if (inner.endsWith('s')) {
      const n = Number.parseFloat(inner.slice(0, -1))
      return Number.isFinite(n) ? n * 1000 : null
    }
    const n = Number.parseFloat(inner)
    return Number.isFinite(n) ? n : null
  }
  // Tailwind numeric scale: duration-300 → 300ms, delay-150 → 150ms.
  const n = Number.parseFloat(rest)
  if (Number.isFinite(n) && /^\d+$/.test(rest)) return n
  return null
}

export function resolveTransitions(className: string): ResolveResult | null {
  // Property groups (transition, transition-colors, transition-none, ...).
  const props = TRANSITION_GROUPS[className]
  if (props) {
    if (className === 'transition-none') {
      return {
        style: {
          transitionProperty: 'none',
          transitionDuration: '0ms',
        },
        tokensUsed: [],
      }
    }
    return {
      style: {
        transitionProperty: props.join(', '),
        transitionDuration: `${DEFAULT_DURATION_MS}ms`,
        transitionTimingFunction: DEFAULT_EASE,
      },
      tokensUsed: [],
    }
  }

  // duration-<n> | duration-[200ms]
  // Emit as a CSS time string (e.g. "300ms"). react-native-web's value
  // normalizer appends "px" to bare numbers — that breaks transition-duration.
  if (className.startsWith('duration-')) {
    const ms = parseMs(className.slice('duration-'.length))
    if (ms === null) return null
    return { style: { transitionDuration: `${ms}ms` }, tokensUsed: [] }
  }

  // delay-<n> | delay-[200ms]
  if (className.startsWith('delay-')) {
    const ms = parseMs(className.slice('delay-'.length))
    if (ms === null) return null
    return { style: { transitionDelay: `${ms}ms` }, tokensUsed: [] }
  }

  // ease-<name> | ease-[cubic-bezier(...)]
  if (className.startsWith('ease-')) {
    const rest = className.slice('ease-'.length)
    if (rest.startsWith('[') && rest.endsWith(']')) {
      return {
        style: { transitionTimingFunction: rest.slice(1, -1) },
        tokensUsed: [],
      }
    }
    const named = NAMED_EASE[rest]
    if (named) {
      return { style: { transitionTimingFunction: named }, tokensUsed: [] }
    }
    return null
  }

  return null
}
