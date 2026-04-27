import { describe, it, expect, afterAll } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInitBare } from '../cli/init-bare.js'

const dirs: string[] = []
function mkRoot(): string {
  const d = mkdtempSync(join(tmpdir(), 'lunarcss-bare-'))
  dirs.push(d)
  writeFileSync(
    join(d, 'package.json'),
    JSON.stringify({ name: 'bare', dependencies: { 'react-native': '0.76.0' } }, null, 2),
  )
  return d
}
afterAll(() => {
  for (const d of dirs) {
    try {
      rmSync(d, { recursive: true, force: true })
    } catch {}
  }
})

describe('runInitBare (fresh project)', () => {
  it('creates lunar.config.ts + metro.config.js + .gitignore', () => {
    const root = mkRoot()
    runInitBare({ projectRoot: root })

    expect(existsSync(join(root, 'lunar.config.ts'))).toBe(true)
    expect(existsSync(join(root, 'metro.config.js'))).toBe(true)
    const metro = readFileSync(join(root, 'metro.config.js'), 'utf8')
    expect(metro).toContain(`require('@react-native/metro-config')`)
    expect(metro).toContain('withLunarCSS')
    expect(metro).not.toContain('expo/metro-config')

    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toMatch(/# LunarCSS\n\.lunarcss\//)
  })

  it('does NOT create any CSS files', () => {
    const root = mkRoot()
    runInitBare({ projectRoot: root })
    expect(existsSync(join(root, 'app/globals.css'))).toBe(false)
    expect(existsSync(join(root, 'global.css'))).toBe(false)
    expect(existsSync(join(root, 'lunar.css'))).toBe(false)
  })
})

describe('runInitBare (merge into existing metro.config.js)', () => {
  it('wraps a bare RN metro.config.js with withLunarCSS', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'metro.config.js'),
      `const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const config = getDefaultConfig(__dirname)
module.exports = mergeConfig(config, {})
`,
    )
    runInitBare({ projectRoot: root })
    const out = readFileSync(join(root, 'metro.config.js'), 'utf8')
    expect(out).toMatch(/require\(['"]lunarcss\/metro['"]\)/)
    expect(out).toMatch(/module\.exports\s*=\s*withLunarCSS\(/)
  })

  it('skips when already wrapped', () => {
    const root = mkRoot()
    const original = `const { getDefaultConfig } = require('@react-native/metro-config')
const { withLunarCSS } = require('lunarcss/metro')
module.exports = withLunarCSS(getDefaultConfig(__dirname))
`
    writeFileSync(join(root, 'metro.config.js'), original)
    runInitBare({ projectRoot: root })
    expect(readFileSync(join(root, 'metro.config.js'), 'utf8')).toBe(original)
  })
})

describe('runInitBare (idempotent re-run)', () => {
  it('does not overwrite existing lunar.config.ts', () => {
    const root = mkRoot()
    runInitBare({ projectRoot: root })
    writeFileSync(join(root, 'lunar.config.ts'), '// user')
    const second = runInitBare({ projectRoot: root })
    expect(second.steps.find((s) => s.label === 'lunar.config.ts')!.result.status).toBe(
      'skipped-existing',
    )
  })

  it('does not double-wrap metro.config.js', () => {
    const root = mkRoot()
    runInitBare({ projectRoot: root })
    const second = runInitBare({ projectRoot: root })
    expect(second.steps.find((s) => s.label === 'metro.config.js')!.result.status).toBe(
      'unchanged',
    )
    const out = readFileSync(join(root, 'metro.config.js'), 'utf8')
    expect(out.match(/lunarcss\/metro/g)?.length).toBe(1)
  })

  it('does not duplicate .gitignore section', () => {
    const root = mkRoot()
    runInitBare({ projectRoot: root })
    runInitBare({ projectRoot: root })
    const content = readFileSync(join(root, '.gitignore'), 'utf8')
    expect(content.match(/# LunarCSS/g)?.length).toBe(1)
  })
})
