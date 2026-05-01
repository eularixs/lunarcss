// Integration test against the BUILT dist — guards against regressions in
// CJS/ESM interop for @babel/traverse and @babel/generator that only surface
// after tsup output is loaded by Node (Metro bundling). Source-level tests
// pass through Vitest's transform pipeline and miss the failure mode.

import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST_TRANSFORMER = resolve(
  __dirname,
  '../../dist/metro/transformer.js',
)

const distExists = existsSync(DIST_TRANSFORMER)

const maybe = distExists ? describe : describe.skip

maybe('dist metro/transformer (built artifact)', () => {
  it('transformClassNames does not throw "traverse is not a function"', async () => {
    const mod = await import(DIST_TRANSFORMER)
    expect(typeof mod.transformClassNames).toBe('function')
    const src = `
      import { View } from 'react-native'
      export const A = () => <View className="p-4 bg-primary" />
    `
    const out = mod.transformClassNames({ src, filename: 'A.tsx' })
    expect(out.code).toContain('__lcssTw')
    expect(out.code).toMatch(/style=\{__lcssTw\(["']p-4 bg-primary["']\)\}/)
    expect(out.code).not.toContain('className="p-4 bg-primary"')
  })

  it('transform() Metro entry skips node_modules and non-className files', async () => {
    const mod = await import(DIST_TRANSFORMER)
    expect(typeof mod.transform).toBe('function')
    // Stub upstream so transform() doesn't try to load
    // @react-native/metro-babel-transformer at the dist level.
    process.env.LUNARCSS_UPSTREAM_TRANSFORMER = resolve(
      __dirname,
      './fixtures/upstream-stub.cjs',
    )
    // node_modules .ts file with TS syntax our parser plugin set doesn't enable
    // (overload signatures with optional `?<...>`). Pre-fix this would crash.
    const tricky = `
      export interface E<T> {
        startObserving?<K extends keyof T>(name: K): void
      }
    `
    const r1 = mod.transform({
      src: tricky,
      filename: '/x/node_modules/expo-modules-core/src/foo.ts',
    })
    expect(r1).toBeDefined()
    // File with no className — should pass through untouched.
    const r2 = mod.transform({
      src: 'export const x = 1',
      filename: '/proj/src/plain.ts',
    })
    expect(r2).toBeDefined()
  })
})
