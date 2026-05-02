// Tests styledComponent on both native (default) and web (process.env.EXPO_OS)
// paths. Uses React's no-renderer pattern: createElement returns a virtual
// node we inspect directly — avoids pulling in jsdom or react-test-renderer.

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import type { ComponentType, ReactElement } from 'react'

interface VNode {
  type: unknown
  props: Record<string, unknown>
}

function asV(node: ReactElement): VNode {
  return node as unknown as VNode
}

const Stub = ((_p: Record<string, unknown>) => null) as ComponentType<Record<string, unknown>>
;(Stub as unknown as { displayName: string }).displayName = 'Stub'

describe('styledComponent (native)', () => {
  beforeEach(async () => {
    vi.resetModules()
    delete process.env.EXPO_OS
  })

  // Helper: load styled (which boots tw.ts → replaceTokens(empty) wipes
  // the registry), THEN seed tokens. The order is important — replaceTokens
  // is called once on boot from `@lunar-kit/css/__theme__` (which is empty
  // in test env via the vitest alias), so seeding before import would be
  // immediately wiped.
  async function loadAndSeed(tokens: Record<string, string>) {
    const styled = await import('../runtime/styled.js')
    const { clearTokens, setTokens } = await import('../runtime/tokens.js')
    clearTokens()
    setTokens(tokens)
    return styled
  }

  it('converts className → style on native', async () => {
    const { styledComponent } = await loadAndSeed({
      '--color-primary': '#6366f1',
      '--spacing-card': '24px',
    })
    const Wrapped = styledComponent(Stub)
    const node = asV(
      Wrapped({ className: 'bg-primary p-card' } as Record<string, unknown>) as ReactElement,
    )
    expect(node.props.className).toBeUndefined()
    expect(node.props.style).toEqual({ backgroundColor: '#6366f1', padding: 24 })
  })

  it('handles multiple style props (style + contentContainerStyle)', async () => {
    const { styledComponent } = await loadAndSeed({
      '--color-primary': '#6366f1',
      '--spacing-card': '24px',
    })
    const Wrapped = styledComponent(Stub, {
      styleProps: ['style', 'contentContainerStyle'],
    })
    const node = asV(
      Wrapped({
        className: 'bg-primary',
        contentContainerClassName: 'p-card',
      } as Record<string, unknown>) as ReactElement,
    )
    expect(node.props.className).toBeUndefined()
    expect(node.props.contentContainerClassName).toBeUndefined()
    expect(node.props.style).toEqual({ backgroundColor: '#6366f1' })
    expect(node.props.contentContainerStyle).toEqual({ padding: 24 })
  })

  it('preserves existing style by merging', async () => {
    const { styledComponent } = await loadAndSeed({
      '--color-primary': '#6366f1',
    })
    const Wrapped = styledComponent(Stub)
    const node = asV(
      Wrapped({
        className: 'bg-primary',
        style: { opacity: 0.5 },
      } as Record<string, unknown>) as ReactElement,
    )
    expect(Array.isArray(node.props.style)).toBe(true)
    const styleArr = node.props.style as Array<unknown>
    expect(styleArr).toEqual([{ backgroundColor: '#6366f1' }, { opacity: 0.5 }])
  })

  it('passes through when no className present', async () => {
    const { styledComponent } = await loadAndSeed({})
    const Wrapped = styledComponent(Stub)
    const node = asV(
      Wrapped({ style: { padding: 4 } } as Record<string, unknown>) as ReactElement,
    )
    expect(node.props.style).toEqual({ padding: 4 })
  })
})

describe('styledComponent (web)', () => {
  // Web now uses the SAME engine as native — RN-Web strips className from
  // primitives, so we always feed RN-Web a real `style` object. These tests
  // verify the web path still converts (no platform-specific passthrough).
  let originalExpoOs: string | undefined
  beforeAll(() => {
    originalExpoOs = process.env.EXPO_OS
  })
  afterAll(() => {
    if (originalExpoOs === undefined) delete process.env.EXPO_OS
    else process.env.EXPO_OS = originalExpoOs
  })

  beforeEach(async () => {
    vi.resetModules()
    process.env.EXPO_OS = 'web'
  })

  // Same load-then-seed pattern as the native suite — replaceTokens at boot
  // (from `@lunar-kit/css/__theme__`) wipes the registry, so seed tokens
  // AFTER the import.
  async function loadAndSeed(tokens: Record<string, string>) {
    const styled = await import('../runtime/styled.js')
    const { clearTokens, setTokens } = await import('../runtime/tokens.js')
    clearTokens()
    setTokens(tokens)
    return styled
  }

  it('converts className → style on web (same engine as native)', async () => {
    const { styledComponent } = await loadAndSeed({
      '--color-primary': '#6366f1',
    })
    const Wrapped = styledComponent(Stub)
    const node = asV(
      Wrapped({ className: 'bg-primary flex-1' } as Record<string, unknown>) as ReactElement,
    )
    expect(node.props.className).toBeUndefined()
    expect(node.props.style).toEqual({ backgroundColor: '#6366f1', flex: 1 })
  })

  it('strips auxiliary <x>ClassName props after converting on web', async () => {
    const { styledComponent } = await loadAndSeed({
      '--color-primary': '#6366f1',
    })
    const Wrapped = styledComponent(Stub, {
      styleProps: ['style', 'contentContainerStyle'],
    })
    const node = asV(
      Wrapped({
        className: 'flex-1',
        contentContainerClassName: 'bg-primary',
      } as Record<string, unknown>) as ReactElement,
    )
    expect(node.props.className).toBeUndefined()
    expect(node.props.contentContainerClassName).toBeUndefined()
    expect(node.props.style).toEqual({ flex: 1 })
    expect(node.props.contentContainerStyle).toEqual({ backgroundColor: '#6366f1' })
  })
})
