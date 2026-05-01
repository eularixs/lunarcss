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

  const existingTypes = json.compilerOptions?.types
  // Only mutate `types` when the user already opts into an explicit array.
  // Adding a fresh `types` field narrows TS ambient type discovery and hides
  // @types/node, @types/react, etc. — which silently breaks Expo/RN projects.
  // For projects without an explicit `types`, we wire augmentation via a
  // triple-slash reference in the entry file instead (see ensureTypesReference).
  if (!existingTypes) {
    return null
  }
  if (existingTypes.includes('lunarcss/types')) {
    return { label: 'tsconfig.json', result: { path, status: 'unchanged' } }
  }

  json.compilerOptions = {
    ...(json.compilerOptions ?? {}),
    types: [...existingTypes, 'lunarcss/types'],
  }
  const next = `${JSON.stringify(json, null, 2)}\n`
  return {
    label: 'tsconfig.json',
    result: dryRun
      ? { path, status: 'updated' }
      : writeFileChanged(path, next),
  }
}

const TYPES_REFERENCE = '/// <reference types="lunarcss/types" />\n'

// Insert a triple-slash reference to lunarcss/types in the project's entry
// file when tsconfig.json doesn't have an explicit `types` array. Idempotent.
export function ensureTypesReference(
  projectRoot: string,
  dryRun: boolean,
  candidates: readonly string[],
): InitStep | null {
  const tsconfig = join(projectRoot, 'tsconfig.json')
  if (existsSync(tsconfig)) {
    try {
      const json = JSON.parse(readFileSync(tsconfig, 'utf8')) as {
        compilerOptions?: { types?: string[] }
      }
      // tsconfig route already covers it.
      if (json.compilerOptions?.types) return null
    } catch {
      // fall through — write the reference defensively.
    }
  }

  for (const rel of candidates) {
    const full = join(projectRoot, rel)
    if (!existsSync(full)) continue
    const prev = readFileSync(full, 'utf8')
    if (prev.includes('lunarcss/types')) {
      return { label: rel, result: { path: full, status: 'unchanged' } }
    }
    const next = `${TYPES_REFERENCE}${prev}`
    return {
      label: rel,
      result: dryRun
        ? { path: full, status: 'updated' }
        : writeFileChanged(full, next),
    }
  }
  return null
}

// Web styling pipeline (Tailwind v4 + lunarcss/web/plugin) for native projects
// that also target web (Expo Web, RN Bare with react-native-web). Three
// outputs:
//   1. global.css with `@import "tailwindcss"`.
//   2. postcss.config.js wiring lunarcss before @tailwindcss/postcss.
//   3. CSS import in the project's web entry (handled separately by
//      ensureWebCssImport).

const GLOBAL_CSS_BODY = '@import "tailwindcss";\n'

const POSTCSS_CONFIG_BODY = `const lunarcssMod = require('lunarcss/web/plugin')
const lunarcss = lunarcssMod.default ?? lunarcssMod

module.exports = {
  plugins: [
    // Order matters: lunarcss injects @theme tokens BEFORE Tailwind reads them.
    lunarcss(),
    require('@tailwindcss/postcss'),
  ],
}
`

export function ensureGlobalCss(projectRoot: string, dryRun: boolean): InitStep {
  const path = join(projectRoot, 'global.css')
  if (dryRun) {
    return {
      label: 'global.css',
      result: { path, status: existsSync(path) ? 'skipped-existing' : 'created' },
    }
  }
  return {
    label: 'global.css',
    result: writeFileIfMissing(path, GLOBAL_CSS_BODY),
  }
}

export function ensurePostcssConfig(projectRoot: string, dryRun: boolean): InitStep | null {
  // Skip when any postcss.config.* already exists — we don't want to clobber
  // user-managed PostCSS pipelines (e.g. autoprefixer, cssnano).
  for (const ext of ['js', 'cjs', 'mjs', 'ts']) {
    if (existsSync(join(projectRoot, `postcss.config.${ext}`))) {
      return null
    }
  }
  const path = join(projectRoot, 'postcss.config.js')
  if (dryRun) {
    return { label: 'postcss.config.js', result: { path, status: 'created' } }
  }
  return {
    label: 'postcss.config.js',
    result: writeFileIfMissing(path, POSTCSS_CONFIG_BODY),
  }
}

const CSS_IMPORT_LINE = "import '../global.css';\n"
const CSS_IMPORT_LINE_FLAT = "import './global.css';\n"

// Inject `import '../global.css'` (or `./global.css` for flat-root entries)
// into the project's web/JS entry file. Idempotent — runs only when no other
// `global.css` import exists in the file.
export function ensureWebCssImport(
  projectRoot: string,
  dryRun: boolean,
  candidates: readonly string[],
): InitStep | null {
  for (const rel of candidates) {
    const full = join(projectRoot, rel)
    if (!existsSync(full)) continue
    const prev = readFileSync(full, 'utf8')
    if (prev.includes('global.css')) {
      return { label: rel, result: { path: full, status: 'unchanged' } }
    }
    // Pick relative path based on whether the entry sits inside a subdir.
    const importLine = rel.includes('/') ? CSS_IMPORT_LINE : CSS_IMPORT_LINE_FLAT
    // Insert AFTER the last import statement at file top (cleaner than top).
    const lines = prev.split('\n')
    let insertAt = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (/^\s*(\/\/|\/\*|import |\s*$)/.test(line)) {
        if (line.startsWith('import ')) insertAt = i + 1
        continue
      }
      break
    }
    const next = [
      ...lines.slice(0, insertAt),
      importLine.trimEnd(),
      ...lines.slice(insertAt),
    ].join('\n')
    return {
      label: rel,
      result: dryRun
        ? { path: full, status: 'updated' }
        : writeFileChanged(full, next),
    }
  }
  return null
}
