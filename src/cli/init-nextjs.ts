import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { writeFileChanged, writeFileIfMissing } from './util-fs.js'
import {
  GLOBAL_CSS_DEFAULT,
  LUNARCSS_BLOCK_BODY,
  LUNARCSS_BLOCK_HEADER,
} from './templates/global-css.tmpl.js'
import {
  ensureGitignore,
  ensureLunarConfig,
  ensureTsconfigTypes,
  type InitStep,
} from './init-shared.js'

export interface InitNextjsOptions {
  projectRoot: string
  dryRun?: boolean
}

export interface InitNextjsReport {
  steps: InitStep[]
  warnings: string[]
}

// Next.js global CSS conventions in priority order. First match is patched.
// If none exist, we create `app/globals.css` (App Router default).
const GLOBAL_CSS_CANDIDATES = [
  'app/globals.css',
  'app/global.css',
  'src/app/globals.css',
  'src/app/global.css',
  'styles/globals.css',
  'styles/global.css',
  'src/styles/globals.css',
  'src/styles/global.css',
] as const

function findGlobalCss(projectRoot: string): string | null {
  for (const rel of GLOBAL_CSS_CANDIDATES) {
    const abs = join(projectRoot, rel)
    if (existsSync(abs)) return abs
  }
  return null
}

function patchGlobalCss(
  path: string,
  prev: string,
): { changed: boolean; code: string } {
  if (prev.includes(LUNARCSS_BLOCK_HEADER)) {
    return { changed: false, code: prev }
  }
  // Insert at top: helps Tailwind directives precede other rules.
  const next = `${LUNARCSS_BLOCK_BODY}\n${prev}`
  return { changed: true, code: next }
}

export function runInitNextjs(options: InitNextjsOptions): InitNextjsReport {
  const { projectRoot, dryRun = false } = options
  const steps: InitStep[] = []
  const warnings: string[] = []

  steps.push(ensureLunarConfig(projectRoot, dryRun))

  // global.css — discover existing or create at app/globals.css
  const found = findGlobalCss(projectRoot)
  if (found) {
    const prev = readFileSync(found, 'utf8')
    const { changed, code } = patchGlobalCss(found, prev)
    if (!changed) {
      steps.push({ label: 'global.css', result: { path: found, status: 'unchanged' } })
    } else {
      steps.push({
        label: 'global.css',
        result: dryRun
          ? { path: found, status: 'updated' }
          : writeFileChanged(found, code),
      })
    }
  } else {
    const target = join(projectRoot, 'app/globals.css')
    steps.push({
      label: 'global.css',
      result: dryRun
        ? { path: target, status: 'created' }
        : writeFileIfMissing(target, GLOBAL_CSS_DEFAULT),
    })
    warnings.push(
      'No existing global.css found. Created app/globals.css. ' +
        'Import it from your root layout (e.g. app/layout.tsx).',
    )
  }

  steps.push(ensureGitignore(projectRoot, dryRun))
  const ts = ensureTsconfigTypes(projectRoot, dryRun)
  if (ts) steps.push(ts)

  return { steps, warnings }
}
