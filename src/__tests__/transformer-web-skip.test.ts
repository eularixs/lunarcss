// Verifies the Metro transformer rewrites className on every platform —
// including web — because react-native-web strips className from primitives.
// The runtime web tw entry runs the same resolver as native; RN-Web turns
// the resulting style object into atomic CSS at render time.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { resolve } from 'node:path'

const ORIG_UPSTREAM = process.env.LUNARCSS_UPSTREAM_TRANSFORMER

beforeAll(() => {
  process.env.LUNARCSS_UPSTREAM_TRANSFORMER = resolve(
    __dirname,
    './fixtures/upstream-stub.cjs',
  )
})
afterAll(() => {
  if (ORIG_UPSTREAM === undefined) delete process.env.LUNARCSS_UPSTREAM_TRANSFORMER
  else process.env.LUNARCSS_UPSTREAM_TRANSFORMER = ORIG_UPSTREAM
})

describe('Metro transformer platform handling', () => {
  it('on web: rewrites className to style (RN-Web strips className)', async () => {
    const { transform } = await import('../metro/transformer.js')
    const src = `
      import { View } from 'react-native'
      export const A = () => <View className="bg-primary" />
    `
    const result = transform({
      src,
      filename: '/proj/app/A.tsx',
      options: { projectRoot: '/proj', platform: 'web' },
    }) as { src: string }
    expect(result.src).toContain('__lcssTw("bg-primary")')
    expect(result.src).not.toContain('className="bg-primary"')
  })

  it('on ios: rewrites className to style', async () => {
    const { transform } = await import('../metro/transformer.js')
    const src = `
      import { View } from 'react-native'
      export const A = () => <View className="bg-primary" />
    `
    const result = transform({
      src,
      filename: '/proj/app/A.tsx',
      options: { projectRoot: '/proj', platform: 'ios' },
    }) as { src: string }
    expect(result.src).toContain('__lcssTw("bg-primary")')
    expect(result.src).not.toContain('className="bg-primary"')
  })

  it('on android: rewrites className', async () => {
    const { transform } = await import('../metro/transformer.js')
    const src = `
      import { View } from 'react-native'
      export const A = () => <View className="p-4" />
    `
    const result = transform({
      src,
      filename: '/proj/app/A.tsx',
      options: { projectRoot: '/proj', platform: 'android' },
    }) as { src: string }
    expect(result.src).toContain('__lcssTw("p-4")')
  })
})
