import { describe, it, expect, afterAll } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { detectProject } from '../cli/detect.js'

const dirs: string[] = []
function mkRoot(pkg: object | null = null): string {
  const d = mkdtempSync(join(tmpdir(), 'lunarcss-detect-'))
  dirs.push(d)
  if (pkg) writeFileSync(join(d, 'package.json'), JSON.stringify(pkg, null, 2))
  return d
}
afterAll(() => {
  for (const d of dirs) {
    try {
      rmSync(d, { recursive: true, force: true })
    } catch {}
  }
})

describe('detectProject', () => {
  it('returns unknown when no package.json', () => {
    const root = mkRoot()
    const r = detectProject(root)
    expect(r.kind).toBe('unknown')
    expect(r.notes.length).toBeGreaterThan(0)
  })

  it('detects Expo via dependencies', () => {
    const root = mkRoot({ name: 'app', dependencies: { expo: '~51.0.0' } })
    const r = detectProject(root)
    expect(r.kind).toBe('expo')
    expect(r.expoSdkVersion).toBe(51)
  })

  it('warns when Expo SDK is older than 50', () => {
    const root = mkRoot({ name: 'old', dependencies: { expo: '~49.0.0' } })
    const r = detectProject(root)
    expect(r.kind).toBe('expo')
    expect(r.expoSdkVersion).toBe(49)
    expect(r.notes.some((n) => n.includes('SDK 50+'))).toBe(true)
  })

  it('detects Next.js', () => {
    const root = mkRoot({ name: 'web', dependencies: { next: '15.1.0' } })
    expect(detectProject(root).kind).toBe('nextjs')
  })

  it('detects RN Bare when react-native present without expo', () => {
    const root = mkRoot({ name: 'bare', dependencies: { 'react-native': '0.76.0' } })
    expect(detectProject(root).kind).toBe('rn-bare')
  })

  it('Expo wins over react-native when both present', () => {
    const root = mkRoot({
      name: 'expo-app',
      dependencies: { expo: '~51.0.0', 'react-native': '0.76.0' },
    })
    expect(detectProject(root).kind).toBe('expo')
  })
})
