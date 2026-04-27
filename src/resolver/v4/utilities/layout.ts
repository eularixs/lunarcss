import type { ResolveResult, ResolvedStyle } from '../../../runtime/types.js'

const STATIC_MAP: Readonly<Record<string, ResolvedStyle>> = {
  // display + flex
  flex: { display: 'flex' },
  hidden: { display: 'none' },
  'flex-row': { flexDirection: 'row' },
  'flex-col': { flexDirection: 'column' },
  'flex-row-reverse': { flexDirection: 'row-reverse' },
  'flex-col-reverse': { flexDirection: 'column-reverse' },
  'flex-wrap': { flexWrap: 'wrap' },
  'flex-nowrap': { flexWrap: 'nowrap' },
  'flex-wrap-reverse': { flexWrap: 'wrap-reverse' },
  'flex-1': { flex: 1 },
  'flex-auto': { flexGrow: 1, flexShrink: 1, flexBasis: 'auto' },
  'flex-initial': { flexGrow: 0, flexShrink: 1, flexBasis: 'auto' },
  'flex-none': { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  'flex-grow': { flexGrow: 1 },
  'flex-grow-0': { flexGrow: 0 },
  'flex-shrink': { flexShrink: 1 },
  'flex-shrink-0': { flexShrink: 0 },
  grow: { flexGrow: 1 },
  'grow-0': { flexGrow: 0 },
  shrink: { flexShrink: 1 },
  'shrink-0': { flexShrink: 0 },

  // align items
  'items-start': { alignItems: 'flex-start' },
  'items-end': { alignItems: 'flex-end' },
  'items-center': { alignItems: 'center' },
  'items-baseline': { alignItems: 'baseline' },
  'items-stretch': { alignItems: 'stretch' },

  // justify content
  'justify-start': { justifyContent: 'flex-start' },
  'justify-end': { justifyContent: 'flex-end' },
  'justify-center': { justifyContent: 'center' },
  'justify-between': { justifyContent: 'space-between' },
  'justify-around': { justifyContent: 'space-around' },
  'justify-evenly': { justifyContent: 'space-evenly' },

  // align self
  'self-auto': { alignSelf: 'auto' },
  'self-start': { alignSelf: 'flex-start' },
  'self-end': { alignSelf: 'flex-end' },
  'self-center': { alignSelf: 'center' },
  'self-stretch': { alignSelf: 'stretch' },
  'self-baseline': { alignSelf: 'baseline' },

  // align content
  'content-start': { alignContent: 'flex-start' },
  'content-end': { alignContent: 'flex-end' },
  'content-center': { alignContent: 'center' },
  'content-between': { alignContent: 'space-between' },
  'content-around': { alignContent: 'space-around' },
  'content-stretch': { alignContent: 'stretch' },

  // position
  absolute: { position: 'absolute' },
  relative: { position: 'relative' },
  static: { position: 'static' },

  // overflow
  'overflow-hidden': { overflow: 'hidden' },
  'overflow-visible': { overflow: 'visible' },
  'overflow-scroll': { overflow: 'scroll' },
}

export function resolveLayout(className: string): ResolveResult | null {
  const style = STATIC_MAP[className]
  if (style) return { style: { ...style }, tokensUsed: [] }

  // z-N
  if (className.startsWith('z-')) {
    const rest = className.slice(2)
    if (rest === 'auto') return { style: { zIndex: 0 }, tokensUsed: [] }
    if (rest.startsWith('[') && rest.endsWith(']')) {
      const n = Number.parseInt(rest.slice(1, -1), 10)
      if (Number.isFinite(n)) return { style: { zIndex: n }, tokensUsed: [] }
    }
    const n = Number.parseInt(rest, 10)
    if (Number.isFinite(n)) return { style: { zIndex: n }, tokensUsed: [] }
  }

  // flex-N (numeric flex grow)
  if (className.startsWith('flex-')) {
    const rest = className.slice(5)
    const n = Number.parseFloat(rest)
    if (Number.isFinite(n) && /^-?\d+(\.\d+)?$/.test(rest)) {
      return { style: { flex: n }, tokensUsed: [] }
    }
  }

  return null
}
