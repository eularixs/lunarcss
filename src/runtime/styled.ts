// styledComponent — wrap a third-party / custom RN component so it accepts
// `className` (and any number of additional `<x>ClassName` props that
// correspond to its own `<x>Style` props). Both platforms: converts each
// className prop to its style counterpart via `__lcssTw()`. On web,
// __lcssTw runs the same resolver as native and RN-Web turns the resulting
// style object into atomic CSS.
//
// This is the runtime fallback for components NOT in the transformer's
// STYLE_PROPS_MAP — e.g. `<LinearGradient />`, `<BlurView />`, custom design
// system primitives. Whitelisted RN components are rewritten at build time
// with zero runtime cost; this wrapper is the next-best option.

import { createElement, type ComponentType, type ReactElement } from 'react'
import { __lcssTw } from './tw.js'
import { classNamePropFor } from './class-name-pair.js'

export type ClassNameProps = Record<string, string | undefined>

export interface StyledOptions<P> {
  // Names of style props the wrapped component accepts. Each one gets a
  // matching className prop computed via classNamePropFor(styleProp).
  styleProps?: ReadonlyArray<keyof P & string>
}

const DEFAULT_STYLE_PROPS = ['style'] as const

export function styledComponent<P extends object>(
  Component: ComponentType<P>,
  options: StyledOptions<P> = {},
): ComponentType<P & ClassNameProps> {
  const styleProps = (options.styleProps ?? DEFAULT_STYLE_PROPS) as readonly string[]
  const cnPairs = styleProps.map((sp) => [classNamePropFor(sp), sp] as const)

  const Wrapped = (props: P & ClassNameProps): ReactElement => {
    const next: Record<string, unknown> = { ...(props as Record<string, unknown>) }
    for (const [cnProp, styleProp] of cnPairs) {
      const cls = (props as Record<string, unknown>)[cnProp]
      if (typeof cls !== 'string' || cls.length === 0) continue
      const generated = __lcssTw(cls)
      const existing = (props as Record<string, unknown>)[styleProp]
      next[styleProp] = existing == null ? generated : [generated, existing]
      delete next[cnProp]
    }
    return createElement(Component as ComponentType<unknown>, next as P)
  }

  Wrapped.displayName = `styled(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
  return Wrapped as ComponentType<P & ClassNameProps>
}
