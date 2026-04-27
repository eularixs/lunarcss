// Helpers shared across init flows (Expo / Next / Bare). Keeps the per-flow
// runners focused on what differs between platforms.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  appendSection,
  writeFileChanged,
  writeFileIfMissing,
  type WriteResult,
} from './util-fs.js'
import { LUNAR_CONFIG_TEMPLATE } from './templates/lunar-config.ts.tmpl.js'

export const GITIGNORE_HEADER = '# LunarCSS'
export const GITIGNORE_BODY = '.lunarcss/\n'

export interface InitStep {
  label: string
  result: WriteResult
}

export function ensureLunarConfig(projectRoot: string, dryRun: boolean): InitStep {
  const path = join(projectRoot, 'lunar.config.ts')
  if (dryRun) {
    return {
      label: 'lunar.config.ts',
      result: { path, status: existsSync(path) ? 'skipped-existing' : 'created' },
    }
  }
  return {
    label: 'lunar.config.ts',
    result: writeFileIfMissing(path, LUNAR_CONFIG_TEMPLATE),
  }
}

export function ensureGitignore(projectRoot: string, dryRun: boolean): InitStep {
  const path = join(projectRoot, '.gitignore')
  if (dryRun) {
    const exists = existsSync(path)
    const already = exists && readFileSync(path, 'utf8').includes(GITIGNORE_HEADER)
    return {
      label: '.gitignore',
      result: {
        path,
        status: already ? 'unchanged' : exists ? 'updated' : 'created',
      },
    }
  }
  return {
    label: '.gitignore',
    result: appendSection(path, GITIGNORE_HEADER, GITIGNORE_BODY),
  }
}

export function ensureTsconfigTypes(
  projectRoot: string,
  dryRun: boolean,
): InitStep | null {
  const path = join(projectRoot, 'tsconfig.json')
  if (!existsSync(path)) return null
  const raw = readFileSync(path, 'utf8')
  let json: { compilerOptions?: { types?: string[] } } & Record<string, unknown>
  try {
    json = JSON.parse(raw)
  } catch {
    return { label: 'tsconfig.json', result: { path, status: 'unchanged' } }
  }

  const types = json.compilerOptions?.types ?? []
  if (types.includes('lunarcss/types')) {
    return { label: 'tsconfig.json', result: { path, status: 'unchanged' } }
  }

  json.compilerOptions = {
    ...(json.compilerOptions ?? {}),
    types: [...types, 'lunarcss/types'],
  }
  const next = `${JSON.stringify(json, null, 2)}\n`
  return {
    label: 'tsconfig.json',
    result: dryRun
      ? { path, status: 'updated' }
      : writeFileChanged(path, next),
  }
}
