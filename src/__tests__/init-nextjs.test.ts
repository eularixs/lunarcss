import { describe, it, expect, afterAll } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInitNextjs } from '../cli/init-nextjs.js'

const dirs: string[] = []
function mkRoot(): string {
  const d = mkdtempSync(join(tmpdir(), 'lunarcss-next-'))
  dirs.push(d)
  writeFileSync(
    join(d, 'package.json'),
    JSON.stringify({ name: 'web', dependencies: { next: '15.1.0' } }, null, 2),
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

describe('runInitNextjs (fresh project)', () => {
  it('creates lunar.config.ts + app/globals.css + .gitignore', () => {
    const root = mkRoot()
    const report = runInitNextjs({ projectRoot: root })

    expect(existsSync(join(root, 'lunar.config.ts'))).toBe(true)
    expect(existsSync(join(root, 'app/globals.css'))).toBe(true)
    const css = readFileSync(join(root, 'app/globals.css'), 'utf8')
    expect(css).toContain('@import "tailwindcss"')
    expect(css).toContain('@plugin "lunarcss"')

    expect(existsSync(join(root, '.gitignore'))).toBe(true)
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toMatch(/# LunarCSS\n\.lunarcss\//)

    expect(report.warnings.some((w) => w.includes('Import it from your root layout'))).toBe(true)
  })

  it('does NOT create a metro.config.js', () => {
    const root = mkRoot()
    runInitNextjs({ projectRoot: root })
    expect(existsSync(join(root, 'metro.config.js'))).toBe(false)
  })
})

describe('runInitNextjs (merge into existing global.css)', () => {
  it('prepends LunarCSS block to existing app/globals.css', () => {
    const root = mkRoot()
    mkdirSync(join(root, 'app'))
    writeFileSync(
      join(root, 'app/globals.css'),
      `body { margin: 0; }\n`,
    )
    runInitNextjs({ projectRoot: root })
    const css = readFileSync(join(root, 'app/globals.css'), 'utf8')
    expect(css.startsWith('/* LunarCSS */')).toBe(true)
    expect(css).toContain('@import "tailwindcss"')
    expect(css).toContain('@plugin "lunarcss"')
    expect(css).toContain('body { margin: 0; }')
  })

  it('discovers src/app/globals.css', () => {
    const root = mkRoot()
    mkdirSync(join(root, 'src/app'), { recursive: true })
    writeFileSync(join(root, 'src/app/globals.css'), '')
    runInitNextjs({ projectRoot: root })
    expect(existsSync(join(root, 'app/globals.css'))).toBe(false)
    expect(readFileSync(join(root, 'src/app/globals.css'), 'utf8')).toContain('@plugin "lunarcss"')
  })

  it('discovers styles/globals.css', () => {
    const root = mkRoot()
    mkdirSync(join(root, 'styles'))
    writeFileSync(join(root, 'styles/globals.css'), '')
    runInitNextjs({ projectRoot: root })
    expect(readFileSync(join(root, 'styles/globals.css'), 'utf8')).toContain('@plugin "lunarcss"')
  })
})

describe('runInitNextjs (idempotent re-run)', () => {
  it('does not duplicate the LunarCSS block', () => {
    const root = mkRoot()
    runInitNextjs({ projectRoot: root })
    runInitNextjs({ projectRoot: root })
    const css = readFileSync(join(root, 'app/globals.css'), 'utf8')
    expect(css.match(/\/\* LunarCSS \*\//g)?.length).toBe(1)
    expect(css.match(/@plugin "lunarcss"/g)?.length).toBe(1)
  })

  it('does not overwrite existing lunar.config.ts on re-run', () => {
    const root = mkRoot()
    runInitNextjs({ projectRoot: root })
    writeFileSync(join(root, 'lunar.config.ts'), '// user customized')
    const second = runInitNextjs({ projectRoot: root })
    const lunarStep = second.steps.find((s) => s.label === 'lunar.config.ts')
    expect(lunarStep!.result.status).toBe('skipped-existing')
    expect(readFileSync(join(root, 'lunar.config.ts'), 'utf8')).toBe('// user customized')
  })

  it('reports global.css unchanged on re-run', () => {
    const root = mkRoot()
    runInitNextjs({ projectRoot: root })
    const second = runInitNextjs({ projectRoot: root })
    const cssStep = second.steps.find((s) => s.label === 'global.css')
    expect(cssStep!.result.status).toBe('unchanged')
  })
})
