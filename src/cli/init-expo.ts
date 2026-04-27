import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  appendSection,
  writeFileChanged,
  writeFileIfMissing,
  type WriteResult,
} from './util-fs.js'
import { mergeMetroConfig } from './merge-metro-config.js'
import { LUNAR_CONFIG_TEMPLATE } from './templates/lunar-config.ts.tmpl.js'
import { METRO_CONFIG_EXPO_DEFAULT } from './templates/metro-config.expo.ts.tmpl.js'

export interface InitExpoOptions {
  projectRoot: string
  dryRun?: boolean
}

export interface InitStep {
  label: string
  result: WriteResult
}

export interface InitExpoReport {
  steps: InitStep[]
  warnings: string[]
}

const GITIGNORE_HEADER = '# LunarCSS'
const GITIGNORE_BODY = '.lunarcss/\n'

function patchTsconfigTypes(projectRoot: string, dryRun: boolean): WriteResult | null {
  const path = join(projectRoot, 'tsconfig.json')
  if (!existsSync(path)) return null
  const raw = readFileSync(path, 'utf8')
  let json: { compilerOptions?: { types?: string[] } } & Record<string, unknown>
  try {
    json = JSON.parse(raw)
  } catch {
    return { path, status: 'unchanged' }
  }

  const types = json.compilerOptions?.types ?? []
  if (types.includes('lunarcss/types')) {
    return { path, status: 'unchanged' }
  }

  json.compilerOptions = {
    ...(json.compilerOptions ?? {}),
    types: [...types, 'lunarcss/types'],
  }
  const next = `${JSON.stringify(json, null, 2)}\n`
  if (dryRun) return { path, status: 'updated' }
  return writeFileChanged(path, next)
}

export function runInitExpo(options: InitExpoOptions): InitExpoReport {
  const { projectRoot, dryRun = false } = options
  const steps: InitStep[] = []
  const warnings: string[] = []

  // 1. lunar.config.ts (skip if present — never overwrite user config)
  const lunarConfigPath = join(projectRoot, 'lunar.config.ts')
  steps.push({
    label: 'lunar.config.ts',
    result: dryRun
      ? {
          path: lunarConfigPath,
          status: existsSync(lunarConfigPath) ? 'skipped-existing' : 'created',
        }
      : writeFileIfMissing(lunarConfigPath, LUNAR_CONFIG_TEMPLATE),
  })

  // 2. metro.config.js — create-or-merge
  const metroJsPath = join(projectRoot, 'metro.config.js')
  if (existsSync(metroJsPath)) {
    const prev = readFileSync(metroJsPath, 'utf8')
    const merge = mergeMetroConfig(prev)
    if (merge.reason === 'no-module-exports') {
      warnings.push(
        'metro.config.js exists but has no top-level `module.exports = ...` we could wrap. ' +
          'Manually wrap your config with `withLunarCSS(...)` from `lunarcss/metro`.',
      )
      steps.push({
        label: 'metro.config.js',
        result: { path: metroJsPath, status: 'unchanged' },
      })
    } else if (!merge.changed) {
      steps.push({
        label: 'metro.config.js',
        result: { path: metroJsPath, status: 'unchanged' },
      })
    } else {
      steps.push({
        label: 'metro.config.js',
        result: dryRun
          ? { path: metroJsPath, status: 'updated' }
          : writeFileChanged(metroJsPath, merge.code),
      })
    }
  } else {
    steps.push({
      label: 'metro.config.js',
      result: dryRun
        ? { path: metroJsPath, status: 'created' }
        : writeFileIfMissing(metroJsPath, METRO_CONFIG_EXPO_DEFAULT),
    })
  }

  // 3. .gitignore append
  const gitignorePath = join(projectRoot, '.gitignore')
  if (dryRun) {
    const exists = existsSync(gitignorePath)
    const already = exists && readFileSync(gitignorePath, 'utf8').includes(GITIGNORE_HEADER)
    steps.push({
      label: '.gitignore',
      result: {
        path: gitignorePath,
        status: already ? 'unchanged' : exists ? 'updated' : 'created',
      },
    })
  } else {
    steps.push({
      label: '.gitignore',
      result: appendSection(gitignorePath, GITIGNORE_HEADER, GITIGNORE_BODY),
    })
  }

  // 4. tsconfig.json types augmentation (best-effort, optional)
  const tsResult = patchTsconfigTypes(projectRoot, dryRun)
  if (tsResult) {
    steps.push({ label: 'tsconfig.json', result: tsResult })
  }

  return { steps, warnings }
}
