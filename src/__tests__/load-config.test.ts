import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadLunarConfig } from '../config/load.js'

const dirs: string[] = []

function mkRoot(): string {
  const d = mkdtempSync(join(tmpdir(), 'lunarcss-test-'))
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

describe('loadLunarConfig', () => {
  it('returns null when no config exists', () => {
    const root = mkRoot()
    expect(loadLunarConfig(root)).toBeNull()
  })

  it('loads a TS config file via jiti', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'lunar.config.ts'),
      `export default {
         theme: {
           extend: {
             colors: { primary: '#6366f1' as string },
           },
         },
       } as const
      `,
    )
    const result = loadLunarConfig(root)
    expect(result).not.toBeNull()
    expect(result!.config.theme?.extend?.colors?.primary).toBe('#6366f1')
    expect(result!.filepath).toMatch(/lunar\.config\.ts$/)
  })

  it('loads a JS config file', () => {
    const root = mkRoot()
    writeFileSync(
      join(root, 'lunar.config.js'),
      `module.exports = { theme: { extend: { spacing: { xs: '4px' } } } }`,
    )
    const result = loadLunarConfig(root)
    expect(result?.config.theme?.extend?.spacing?.xs).toBe('4px')
  })

  it('loads when given an absolute path to a config file', () => {
    const root = mkRoot()
    const file = join(root, 'lunar.config.ts')
    writeFileSync(file, `export default { theme: { extend: { colors: { x: '#000' } } } }`)
    const result = loadLunarConfig(file)
    expect(result?.config.theme?.extend?.colors?.x).toBe('#000')
  })

  it('treats projectRoot as a directory even if existsSync returns true', () => {
    const root = mkRoot()
    mkdirSync(join(root, 'sub'))
    writeFileSync(join(root, 'sub/lunar.config.ts'), `export default {}`)
    const result = loadLunarConfig(join(root, 'sub'))
    expect(result).not.toBeNull()
  })
})
