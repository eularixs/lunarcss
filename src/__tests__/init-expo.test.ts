import { describe, it, expect, afterAll } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInitExpo } from '../cli/init-expo.js'
import { mergeMetroConfig } from '../cli/merge-metro-config.js'

const dirs: string[] = []
function mkRoot(): string {
  const d = mkdtempSync(join(tmpdir(), 'lunarcss-init-'))
  dirs.push(d)
  writeFileSync(
    join(d, 'package.json'),
    JSON.stringify({ name: 'app', dependencies: { expo: '~51.0.0' } }, null, 2),
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

describe('runInitExpo (fresh project)', () => {
  it('creates lunar.config.ts, metro.config.js, .gitignore', () => {
    const root = mkRoot()
    const report = runInitExpo({ projectRoot: root })

    expect(existsSync(join(root, 'lunar.config.ts'))).toBe(true)
    expect(readFileSync(join(root, 'lunar.config.ts'), 'utf8')).toContain('defineConfig')

    expect(existsSync(join(root, 'metro.config.js'))).toBe(true)
    expect(readFileSync(join(root, 'metro.config.js'), 'utf8')).toContain('withLunarCSS')

    expect(existsSync(join(root, '.gitignore'))).toBe(true)
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toMatch(/# LunarCSS\n\.lunarcss\//)

    const labels = report.steps.map((s) => s.label)
    expect(labels).toEqual(
      expect.arrayContaining(['lunar.config.ts', 'metro.config.js', '.gitignore']),
    )
  })
})

describe('runInitExpo (idempotent re-run)', () => {
  it('does not overwrite existing lunar.config.ts on re-run', () => {
    const root = mkRoot()
    runInitExpo({ projectRoot: root })
    writeFileSync(join(root, 'lunar.config.ts'), '// user customized')
    const second = runInitExpo({ projectRoot: root })
    const lunarStep = second.steps.find((s) => s.label === 'lunar.config.ts')
    expect(lunarStep!.result.status).toBe('skipped-existing')
    expect(readFileSync(join(root, 'lunar.config.ts'), 'utf8')).toBe('// user customized')
  })

  it('does not double-wrap metro.config.js', () => {
    const root = mkRoot()
    runInitExpo({ projectRoot: root })
    const second = runInitExpo({ projectRoot: root })
    const metroStep = second.steps.find((s) => s.label === 'metro.config.js')
    expect(metroStep!.result.status).toBe('unchanged')
    const out = readFileSync(join(root, 'metro.config.js'), 'utf8')
    const occurrences = out.match(/withLunarCSS/g)?.length ?? 0
    expect(occurrences).toBeGreaterThanOrEqual(1)
    expect(out.match(/@lunar-kit\/css\/metro/g)?.length).toBe(1)
  })

  it('does not duplicate .gitignore section on re-run', () => {
    const root = mkRoot()
    runInitExpo({ projectRoot: root })
    runInitExpo({ projectRoot: root })
    const content = readFileSync(join(root, '.gitignore'), 'utf8')
    expect(content.match(/# LunarCSS/g)?.length).toBe(1)
  })
})

describe('runInitExpo (merge into existing metro.config.js)', () => {
  it('wraps user metro.config.js with withLunarCSS', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'metro.config.js'),
      `const { getDefaultConfig } = require('expo/metro-config')
const config = getDefaultConfig(__dirname)
module.exports = config
`,
    )
    runInitExpo({ projectRoot: root })
    const out = readFileSync(join(root, 'metro.config.js'), 'utf8')
    expect(out).toMatch(/require\(['"]@lunar-kit\/css\/metro['"]\)/)
    expect(out).toMatch(/module\.exports\s*=\s*withLunarCSS\(\s*config\s*\)/)
  })

  it('preserves existing user requires when merging', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'metro.config.js'),
      `const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')
const config = getDefaultConfig(__dirname)
config.resolver.assetExts.push('lottie')
module.exports = config
`,
    )
    runInitExpo({ projectRoot: root })
    const out = readFileSync(join(root, 'metro.config.js'), 'utf8')
    expect(out).toMatch(/require\(['"]node:path['"]\)/)
    expect(out).toMatch(/config\.resolver\.assetExts\.push\(['"]lottie['"]\)/)
    expect(out).toMatch(/require\(['"]@lunar-kit\/css\/metro['"]\)/)
  })

  it('skips when already wrapped', () => {
    const root = mkRoot()
    const original = `const { getDefaultConfig } = require('expo/metro-config')
const { withLunarCSS } = require('@lunar-kit/css/metro')
module.exports = withLunarCSS(getDefaultConfig(__dirname))
`
    writeFileSync(join(root, 'metro.config.js'), original)
    runInitExpo({ projectRoot: root })
    expect(readFileSync(join(root, 'metro.config.js'), 'utf8')).toBe(original)
  })
})

describe('runInitExpo (tsconfig types augmentation)', () => {
  it('appends @lunar-kit/css/types to compilerOptions.types', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { strict: true, types: ['expo/types'] } }, null, 2),
    )
    runInitExpo({ projectRoot: root })
    const json = JSON.parse(readFileSync(join(root, 'tsconfig.json'), 'utf8'))
    expect(json.compilerOptions.types).toContain('expo/types')
    expect(json.compilerOptions.types).toContain('@lunar-kit/css/types')
  })

  it('skips when already present', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { types: ['@lunar-kit/css/types'] } }, null, 2),
    )
    runInitExpo({ projectRoot: root })
    const before = readFileSync(join(root, 'tsconfig.json'), 'utf8')
    runInitExpo({ projectRoot: root })
    expect(readFileSync(join(root, 'tsconfig.json'), 'utf8')).toBe(before)
  })
})

describe('mergeMetroConfig (unit)', () => {
  it('reports already-wired when source contains @lunar-kit/css/metro', () => {
    const out = mergeMetroConfig(`require('@lunar-kit/css/metro')`)
    expect(out.changed).toBe(false)
    expect(out.reason).toBe('already-wired')
  })

  it('reports no-module-exports when assignment missing', () => {
    const out = mergeMetroConfig(`const x = 1`)
    expect(out.changed).toBe(false)
    expect(out.reason).toBe('no-module-exports')
  })
})
