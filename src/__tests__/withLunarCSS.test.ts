import { describe, it, expect, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { withLunarCSS } from '../metro/config.js'

const dirs: string[] = []
function mkRoot(): string {
  const d = mkdtempSync(join(tmpdir(), 'lunarcss-metro-'))
  dirs.push(d)
  return d
}
afterAll(() => {
  for (const d of dirs) {
    try {
      rmSync(d, { recursive: true, force: true })
    } catch {}
  }
})

beforeEach(() => {
  delete process.env.LUNARCSS_UPSTREAM_TRANSFORMER
})

describe('withLunarCSS', () => {
  it('sets babelTransformerPath to LunarCSS transformer', () => {
    const root = mkRoot()
    const out = withLunarCSS({}, { projectRoot: root })
    expect(out.transformer?.babelTransformerPath).toMatch(/metro[\\/]transformer\.js$/)
  })

  it('preserves user babelTransformerPath via env var', () => {
    const root = mkRoot()
    const userPath = '/custom/transformer.js'
    withLunarCSS({ transformer: { babelTransformerPath: userPath } }, { projectRoot: root })
    expect(process.env.LUNARCSS_UPSTREAM_TRANSFORMER).toBe(userPath)
  })

  it('routes @lunar-kit/css/__theme__ to virtual file', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'lunar.config.ts'),
      `export default { theme: { extend: { colors: { primary: '#abc' } } } }`,
    )
    const out = withLunarCSS({}, { projectRoot: root })
    const fn = out.resolver?.resolveRequest
    expect(typeof fn).toBe('function')

    const fakeContext = {
      resolveRequest: () => ({ type: 'sourceFile' as const, filePath: '/should-not-reach' }),
    }
    const resolution = fn!(fakeContext, '@lunar-kit/css/__theme__', 'ios')
    expect(resolution.type).toBe('sourceFile')
    expect(resolution.filePath).toMatch(/\.lunarcss[\\/]__theme__\.js$/)
  })

  it('delegates non-virtual specifiers to upstream resolveRequest', () => {
    const root = mkRoot()
    const out = withLunarCSS({}, { projectRoot: root })
    const fn = out.resolver?.resolveRequest
    let delegated = false
    const fakeContext = {
      resolveRequest: () => {
        delegated = true
        return { type: 'sourceFile' as const, filePath: '/upstream' }
      },
    }
    fn!(fakeContext, 'react-native', 'ios')
    expect(delegated).toBe(true)
  })

  it('chains existing user resolveRequest', () => {
    const root = mkRoot()
    let userCalled = false
    const userFn = (() => {
      userCalled = true
      return { type: 'sourceFile' as const, filePath: '/user' }
    }) as unknown as Parameters<typeof withLunarCSS>[0]['resolver']['resolveRequest']

    const out = withLunarCSS(
      { resolver: { resolveRequest: userFn } },
      { projectRoot: root },
    )
    const fakeContext = {
      resolveRequest: () => ({ type: 'sourceFile' as const, filePath: '/default' }),
    }
    out.resolver!.resolveRequest!(fakeContext, 'some-pkg', null)
    expect(userCalled).toBe(true)
  })

  it('emits theme file with flattened tokens from lunar.config.ts', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'lunar.config.ts'),
      `export default {
         theme: { extend: { colors: { primary: '#6366f1' }, spacing: { xs: '4px' } } },
       }`,
    )
    withLunarCSS({}, { projectRoot: root })
    const themePath = join(root, '.lunarcss', '__theme__.js')
    const fs = require('node:fs') as typeof import('node:fs')
    const content = fs.readFileSync(themePath, 'utf8')
    expect(content).toContain('"--color-primary": "#6366f1"')
    expect(content).toContain('"--spacing-xs": "4px"')
  })
})
