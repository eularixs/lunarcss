// LunarCSS PostCSS plugin.
//
// On every PostCSS run:
//   1. Loads `lunar.config.ts` via jiti (fresh — no module cache).
//   2. Flattens theme tokens (shared with the Metro path).
//   3. Injects an `@theme { ... }` block into the CSS tree, positioned
//      directly before `@import "tailwindcss"` if present, otherwise at the
//      top of the root.
//   4. Reports `lunar.config.ts` as a PostCSS dependency so Next.js / Vite /
//      Webpack invalidate dependent CSS files when the config edits.
//
// This plugin is a Node-side build step. Nothing in this module ships in the
// browser bundle — the `index.web.js` runtime entry stays a passthrough stub.

import type {
  AtRule,
  Comment,
  Helpers,
  Plugin,
  PluginCreator,
  Root,
} from 'postcss'
import { loadLunarConfig } from '../config/load.js'
import { flattenTokens } from '../config/flatten.js'

export interface LunarPostcssOptions {
  // Absolute path to a `lunar.config.{ts,js,mts,mjs,cjs}` file. If omitted,
  // the plugin discovers one starting from `projectRoot`.
  configFile?: string
  // Project root override. Defaults to `process.cwd()`.
  projectRoot?: string
  // When true, the injected block is a no-op even if tokens exist. Useful for
  // verifying the plugin runs without changing CSS output.
  passthrough?: boolean
}

const MARKER = 'lunarcss:emitted'

function findExistingMarker(root: Root): Comment | null {
  let found: Comment | null = null
  root.walkComments((node) => {
    if (node.text.includes(MARKER)) {
      found = node
      return false
    }
    return undefined
  })
  return found
}

function findTailwindImport(root: Root): AtRule | null {
  let found: AtRule | null = null
  root.walkAtRules('import', (rule) => {
    if (/(['"])tailwindcss\1/.test(rule.params)) {
      found = rule
      return false
    }
    return undefined
  })
  return found
}

function shouldRunOn(root: Root): boolean {
  // Only inject into entry CSS files. Heuristic: file references Tailwind via
  // `@import "tailwindcss"` or has been explicitly opted in via `@plugin
  // "lunarcss"`. Avoids polluting unrelated stylesheets that pass through
  // PostCSS in the same project.
  let match = false
  root.walkAtRules((rule) => {
    if (rule.name === 'import' && /tailwindcss/.test(rule.params)) {
      match = true
      return false
    }
    if (rule.name === 'plugin' && /lunar-css|lunarcss/.test(rule.params)) {
      match = true
      return false
    }
    return undefined
  })
  return match
}

function emitThemeBlock(
  root: Root,
  tokens: Record<string, string>,
  helpers: Helpers,
): void {
  if (Object.keys(tokens).length === 0) return

  const themeRule = helpers.atRule({ name: 'theme', params: '' })
  for (const key of Object.keys(tokens).sort()) {
    const value = tokens[key]
    if (value === undefined) continue
    themeRule.append(helpers.decl({ prop: key, value }))
  }

  const marker = helpers.comment({ text: MARKER })
  const insertBefore = findTailwindImport(root)

  if (insertBefore) {
    insertBefore.before(marker)
    insertBefore.before(themeRule)
  } else {
    root.prepend(themeRule)
    root.prepend(marker)
  }
}

const creator: PluginCreator<LunarPostcssOptions> = (
  options: LunarPostcssOptions = {},
): Plugin => {
  return {
    postcssPlugin: 'lunarcss',
    Once(root: Root, helpers: Helpers) {
      const result = helpers.result
      if (!shouldRunOn(root)) return
      if (findExistingMarker(root)) return // idempotent — already injected
      if (options.passthrough) return

      const projectRoot = options.projectRoot ?? process.cwd()
      const loaded = options.configFile
        ? loadLunarConfig(options.configFile)
        : loadLunarConfig(projectRoot)
      if (!loaded) return

      const tokens = flattenTokens(loaded.config)
      emitThemeBlock(root, tokens, helpers)

      // Register dependency so the toolchain (Next.js / Vite / Webpack) re-
      // runs PostCSS when the config file changes.
      result.messages.push({
        type: 'dependency',
        plugin: 'lunarcss',
        file: loaded.filepath,
        parent: result.opts.from ?? '',
      })
    },
  }
}

creator.postcss = true

export default creator
