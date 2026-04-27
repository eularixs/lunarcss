import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { writeFileChanged, writeFileIfMissing } from './util-fs.js'
import { mergeMetroConfig } from './merge-metro-config.js'
import { METRO_CONFIG_EXPO_DEFAULT } from './templates/metro-config.expo.ts.tmpl.js'
import {
  ensureGitignore,
  ensureLunarConfig,
  ensureTsconfigTypes,
  type InitStep,
} from './init-shared.js'

export interface InitExpoOptions {
  projectRoot: string
  dryRun?: boolean
}

export interface InitExpoReport {
  steps: InitStep[]
  warnings: string[]
}

export function runInitExpo(options: InitExpoOptions): InitExpoReport {
  const { projectRoot, dryRun = false } = options
  const steps: InitStep[] = []
  const warnings: string[] = []

  steps.push(ensureLunarConfig(projectRoot, dryRun))

  // metro.config.js — create-or-merge
  const metroJsPath = join(projectRoot, 'metro.config.js')
  if (existsSync(metroJsPath)) {
    const prev = readFileSync(metroJsPath, 'utf8')
    const merge = mergeMetroConfig(prev)
    if (merge.reason === 'no-module-exports') {
      warnings.push(
        'metro.config.js exists but has no top-level `module.exports = ...` we could wrap. ' +
          'Manually wrap your config with `withLunarCSS(...)` from `lunarcss/metro`.',
      )
      steps.push({ label: 'metro.config.js', result: { path: metroJsPath, status: 'unchanged' } })
    } else if (!merge.changed) {
      steps.push({ label: 'metro.config.js', result: { path: metroJsPath, status: 'unchanged' } })
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

  steps.push(ensureGitignore(projectRoot, dryRun))

  const ts = ensureTsconfigTypes(projectRoot, dryRun)
  if (ts) steps.push(ts)

  return { steps, warnings }
}
