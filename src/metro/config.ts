// `withLunarCSS(config)` injects LunarCSS into a Metro config:
//   1. Loads `lunar.config.ts` via jiti at config time (no CSS, no Babel).
//   2. Flattens theme tokens and emits `<projectRoot>/.lunarcss/__theme__.js`.
//   3. Routes the bare specifier `lunar-css/__theme__` to that emitted file
//      via Metro's `resolver.resolveRequest`, so the runtime imports the
//      user's tokens automatically on app boot.
//   4. Sets the babel transformer to LunarCSS's transformer and preserves
//      the user's previous transformer in env so we can chain to it.
//   5. Adds the project root to `watchFolders` so config edits trigger
//      Metro to re-run withLunarCSS via process restart (HMR for tokens
//      requires a Metro restart in this iteration; full content-hash
//      invalidation is Risk #12 follow-up).

import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadLunarConfig } from '../config/load.js'
import { flattenTokens } from '../config/flatten.js'
import { emitVirtualTheme } from '../config/virtual.js'

interface MetroConfigShape {
  watchFolders?: string[]
  resolver?: {
    resolveRequest?: ResolveRequestFn
    [k: string]: unknown
  }
  transformer?: { babelTransformerPath?: string; [k: string]: unknown }
  [k: string]: unknown
}

type ResolveRequestFn = (
  context: ResolveContext,
  moduleName: string,
  platform: string | null,
) => Resolution

interface ResolveContext {
  resolveRequest: ResolveRequestFn
  [k: string]: unknown
}

interface Resolution {
  type: 'sourceFile' | 'assetFiles' | 'empty'
  filePath?: string
}

export interface WithLunarCSSOptions {
  // Path to the lunar.config.ts/js. Defaults to a discovery scan in projectRoot.
  configFile?: string
  // Project root override. Defaults to `process.cwd()`.
  projectRoot?: string
}

const UPSTREAM_ENV_KEY = 'LUNARCSS_UPSTREAM_TRANSFORMER'
const VIRTUAL_SPECIFIER = 'lunar-css/__theme__'
const DEFAULT_UPSTREAM_HINTS = [
  '@react-native/metro-babel-transformer',
  'metro-react-native-babel-transformer',
]

function resolveTransformerPath(): string {
  const here = fileURLToPath(import.meta.url)
  return resolve(dirname(here), './transformer.js')
}

function detectDefaultUpstream(projectRoot: string): string | null {
  const req = createRequire(join(projectRoot, 'package.json'))
  for (const candidate of DEFAULT_UPSTREAM_HINTS) {
    try {
      req.resolve(candidate)
      return candidate
    } catch {
      continue
    }
  }
  return null
}

export function withLunarCSS<T extends MetroConfigShape>(
  config: T,
  options: WithLunarCSSOptions = {},
): T {
  const projectRoot = options.projectRoot ?? process.cwd()

  // 1. Load + flatten user config (no-op if missing).
  const loaded = options.configFile
    ? loadLunarConfig(options.configFile)
    : loadLunarConfig(projectRoot)
  const tokens = flattenTokens(loaded?.config)

  // 2. Emit the generated theme module.
  const { filepath: virtualFile } = emitVirtualTheme(projectRoot, tokens)

  // 3. Wire the babel transformer.
  const transformer = { ...(config.transformer ?? {}) }
  const previous = transformer.babelTransformerPath
  if (previous) {
    process.env[UPSTREAM_ENV_KEY] = previous
  } else if (!process.env[UPSTREAM_ENV_KEY]) {
    const detected = detectDefaultUpstream(projectRoot)
    if (detected) process.env[UPSTREAM_ENV_KEY] = detected
  }
  transformer.babelTransformerPath = resolveTransformerPath()

  // 4. Route `lunar-css/__theme__` to the generated file.
  const userResolver = config.resolver ?? {}
  const previousResolveRequest = userResolver.resolveRequest
  const resolveRequest: ResolveRequestFn = (context, moduleName, platform) => {
    if (moduleName === VIRTUAL_SPECIFIER) {
      return { type: 'sourceFile', filePath: virtualFile }
    }
    if (previousResolveRequest) {
      return previousResolveRequest(context, moduleName, platform)
    }
    return context.resolveRequest(context, moduleName, platform)
  }

  // 5. Watch project root so Metro picks up the generated file + future edits
  //    to lunar.config.ts. (Full hot invalidation = Risk #12 follow-up.)
  const watchFolders = [...(config.watchFolders ?? [])]
  if (loaded && !watchFolders.includes(dirname(loaded.filepath))) {
    watchFolders.push(dirname(loaded.filepath))
  }

  return {
    ...config,
    transformer,
    resolver: {
      ...userResolver,
      resolveRequest,
    },
    watchFolders,
  }
}
