import { describe, it, expect } from 'vitest'
import { transformClassNames } from '../metro/transform-classnames.js'

describe('metro transformClassNames', () => {
  it('rewrites className string literal on intrinsic RN element', () => {
    const src = `
      import { View } from 'react-native'
      export const A = () => <View className="p-4 bg-primary" />
    `
    const out = transformClassNames({ src, filename: 'A.tsx' })
    expect(out.code).toContain('__lcssTw')
    expect(out.code).toMatch(/style=\{__lcssTw\(["']p-4 bg-primary["']\)\}/)
    expect(out.code).not.toContain('className="p-4 bg-primary"')
  })

  it('preserves className for non-intrinsic components', () => {
    const src = `
      import { Custom } from './x'
      export const B = () => <Custom className="p-4" />
    `
    const out = transformClassNames({ src, filename: 'B.tsx' })
    expect(out.code).toContain('className="p-4"')
    expect(out.code).not.toContain('__lcssTw')
  })

  it('handles dynamic className expression', () => {
    const src = `
      import { Text } from 'react-native'
      export const C = ({ active }) => (
        <Text className={active ? 'bg-primary' : 'bg-zinc-100'} />
      )
    `
    const out = transformClassNames({ src, filename: 'C.tsx' })
    expect(out.code).toMatch(
      /style=\{__lcssTw\(active \? ['"]bg-primary['"] : ['"]bg-zinc-100['"]\)\}/,
    )
  })

  it('merges with existing style prop', () => {
    const src = `
      import { View } from 'react-native'
      export const D = () => <View className="px-4" style={{ opacity: 0.5 }} />
    `
    const out = transformClassNames({ src, filename: 'D.tsx' })
    expect(out.code).toContain('style={[__lcssTw("px-4")')
  })

  it('auto-injects __lcssTw import when transform fires', () => {
    const src = `
      import { View } from 'react-native'
      export const E = () => <View className="p-4" />
    `
    const out = transformClassNames({ src, filename: 'E.tsx' })
    expect(out.code).toMatch(/import\s*\{\s*__lcssTw\s*\}\s*from\s*["']lunar-css\/runtime["']/)
  })

  it('does not inject import when nothing transformed', () => {
    const src = `
      import { Custom } from './x'
      export const F = () => <Custom className="p-4" />
    `
    const out = transformClassNames({ src, filename: 'F.tsx' })
    expect(out.code).not.toContain('lunar-css/runtime')
  })

  it('produces a sourcemap', () => {
    const src = `
      import { View } from 'react-native'
      export const G = () => <View className="p-4" />
    `
    const out = transformClassNames({ src, filename: 'G.tsx' })
    expect(out.map).toBeTruthy()
    expect(out.map?.mappings.length).toBeGreaterThan(0)
  })
})
