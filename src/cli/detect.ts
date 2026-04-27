import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type ProjectKind = 'expo' | 'nextjs' | 'rn-bare' | 'unknown'

export interface DetectResult {
  kind: ProjectKind
  projectRoot: string
  packageJsonPath: string | null
  packageJson: PackageJsonShape | null
  expoSdkVersion: number | null
  notes: string[]
}

interface PackageJsonShape {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  [k: string]: unknown
}

function readPackageJson(root: string): {
  path: string | null
  json: PackageJsonShape | null
} {
  const p = join(root, 'package.json')
  if (!existsSync(p)) return { path: null, json: null }
  try {
    const raw = readFileSync(p, 'utf8')
    return { path: p, json: JSON.parse(raw) as PackageJsonShape }
  } catch {
    return { path: p, json: null }
  }
}

function hasDep(pkg: PackageJsonShape, name: string): boolean {
  return Boolean(
    pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? pkg.peerDependencies?.[name],
  )
}

function depVersion(pkg: PackageJsonShape, name: string): string | null {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? pkg.peerDependencies?.[name] ?? null
}

function parseMajor(range: string): number | null {
  const match = range.match(/(\d+)/)
  if (!match || !match[1]) return null
  const n = Number.parseInt(match[1], 10)
  return Number.isFinite(n) ? n : null
}

export function detectProject(projectRoot: string): DetectResult {
  const notes: string[] = []
  const { path: packageJsonPath, json: pkg } = readPackageJson(projectRoot)

  const result: DetectResult = {
    kind: 'unknown',
    projectRoot,
    packageJsonPath,
    packageJson: pkg,
    expoSdkVersion: null,
    notes,
  }

  if (!pkg) {
    notes.push('No package.json found at project root')
    return result
  }

  const isExpo = hasDep(pkg, 'expo')
  const isNext = hasDep(pkg, 'next')
  const isRN = hasDep(pkg, 'react-native')

  if (isExpo) {
    result.kind = 'expo'
    const expoRange = depVersion(pkg, 'expo')
    if (expoRange) {
      const major = parseMajor(expoRange)
      result.expoSdkVersion = major
      if (major !== null && major < 50) {
        notes.push(
          `Expo SDK ${major} detected; LunarCSS targets SDK 50+. ` +
            `Older SDKs may work but are not supported.`,
        )
      }
    }
  } else if (isNext) {
    result.kind = 'nextjs'
  } else if (isRN) {
    result.kind = 'rn-bare'
  }

  return result
}
