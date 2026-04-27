// Load `lunar.config.ts` (or .js) at Node-time using jiti. No CSS parser, no
// Babel pipeline — pure TS evaluation. Safe to call from Metro config and
// PostCSS plugin alike.

import { existsSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { createJiti } from 'jiti'
import type { LunarConfig } from './types.js'

const CANDIDATE_FILENAMES = [
  'lunar.config.ts',
  'lunar.config.mts',
  'lunar.config.js',
  'lunar.config.mjs',
  'lunar.config.cjs',
]

export function findLunarConfig(projectRoot: string): string | null {
  for (const name of CANDIDATE_FILENAMES) {
    const full = resolve(projectRoot, name)
    if (existsSync(full)) return full
  }
  return null
}

export interface LoadedLunarConfig {
  config: LunarConfig
  filepath: string
}

export function loadLunarConfig(
  pathOrProjectRoot: string,
): LoadedLunarConfig | null {
  let filepath: string | null = null
  if (isAbsolute(pathOrProjectRoot) && existsSync(pathOrProjectRoot) && !isDir(pathOrProjectRoot)) {
    filepath = pathOrProjectRoot
  } else {
    filepath = findLunarConfig(pathOrProjectRoot)
  }
  if (!filepath) return null

  const jiti = createJiti(dirname(filepath), {
    interopDefault: true,
    moduleCache: false,
    fsCache: false,
  })
  const mod = jiti(filepath) as LunarConfig | { default?: LunarConfig }
  const config: LunarConfig =
    mod && typeof mod === 'object' && 'default' in mod && mod.default
      ? mod.default
      : (mod as LunarConfig)
  return { config: config ?? {}, filepath }
}

function isDir(p: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs')
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}
