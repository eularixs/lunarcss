import { describe, it, expect, afterAll } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateThemeSource, emitVirtualTheme } from '../config/virtual.js'

const dirs: string[] = []
function mkRoot(): string {
  const d = mkdtempSync(join(tmpdir(), 'lunarcss-virt-'))
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

describe('generateThemeSource', () => {
  it('produces a frozen export with sorted keys', () => {
    const src = generateThemeSource({ '--b': '2', '--a': '1' })
    expect(src).toContain('export const THEME_TOKENS = Object.freeze({')
    const aIdx = src.indexOf('"--a"')
    const bIdx = src.indexOf('"--b"')
    expect(aIdx).toBeGreaterThan(0)
    expect(bIdx).toBeGreaterThan(aIdx)
  })
  it('emits empty object for no tokens', () => {
    expect(generateThemeSource({})).toContain('Object.freeze({\n\n})')
  })
})

describe('emitVirtualTheme', () => {
  it('writes generated file under .lunar-css/__theme__.js', () => {
    const root = mkRoot()
    const result = emitVirtualTheme(root, { '--color-primary': '#6366f1' })
    expect(result.filepath).toMatch(/\.lunarcss[\\/]__theme__\.js$/)
    const content = readFileSync(result.filepath, 'utf8')
    expect(content).toContain('"--color-primary": "#6366f1"')
    expect(result.changed).toBe(true)
  })
  it('skips write when content unchanged', () => {
    const root = mkRoot()
    emitVirtualTheme(root, { '--x': '1' })
    const second = emitVirtualTheme(root, { '--x': '1' })
    expect(second.changed).toBe(false)
  })
  it('rewrites when tokens differ', () => {
    const root = mkRoot()
    emitVirtualTheme(root, { '--x': '1' })
    const second = emitVirtualTheme(root, { '--x': '2' })
    expect(second.changed).toBe(true)
  })
})
