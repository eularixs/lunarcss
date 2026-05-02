// Metro-compatible babel transformer.
// Runs LunarCSS className → __lcssTw() rewrite at the file source level (Risk #1)
// then delegates to the user's upstream transformer (default @react-native/metro-babel-transformer).
//
// `babelTransformerPath` in metro.config.js must point to the built file:
//   require.resolve('lunar-css/metro/transformer')

import { createRequire } from 'node:module'
import { transformClassNames } from './transform-classnames.js'

const TRANSFORMABLE_EXT = /\.(?:[mc]?js|[mc]?jsx|tsx?)$/

interface MetroTransformInput {
  src: string
  filename: string
  options?: {
    projectRoot?: string
    platform?: string | null
    [k: string]: unknown
  }
  [k: string]: unknown
}

interface UpstreamTransformer {
  transform: (input: MetroTransformInput) => unknown
}

const UPSTREAM_ENV_KEY = 'LUNARCSS_UPSTREAM_TRANSFORMER'
const DEFAULT_UPSTREAM = '@react-native/metro-babel-transformer'

let cachedUpstream: UpstreamTransformer | null = null

function loadUpstream(): UpstreamTransformer {
  if (cachedUpstream) return cachedUpstream
  const upstreamPath = process.env[UPSTREAM_ENV_KEY] ?? DEFAULT_UPSTREAM
  const req = createRequire(import.meta.url)
  const mod = req(upstreamPath) as UpstreamTransformer | { default: UpstreamTransformer }
  const resolved =
    'transform' in mod
      ? (mod as UpstreamTransformer)
      : ((mod as { default: UpstreamTransformer }).default)
  if (!resolved || typeof resolved.transform !== 'function') {
    throw new Error(
      `[LunarCSS] Upstream transformer at "${upstreamPath}" does not export a transform function`,
    )
  }
  cachedUpstream = resolved
  return resolved
}

export function transform(input: MetroTransformInput): unknown {
  const upstream = loadUpstream()

  if (!shouldTransform(input)) {
    return upstream.transform(input)
  }

  const { code } = transformClassNames({ src: input.src, filename: input.filename })
  return upstream.transform({ ...input, src: code })
}

function shouldTransform(input: MetroTransformInput): boolean {
  // Note: web is NOT skipped. react-native-web strips `className` from RN
  // primitives (View/Text/Pressable) at render time, so the only way to get
  // styles onto the DOM is to feed RN-Web a real `style` object. The
  // transformer rewrites className → style on every platform; on web the
  // `style` becomes RN-Web atomic CSS, on native it becomes inline RN style.
  // No Tailwind CSS dependency on web.

  // Skip non-JS/TS files.
  if (!TRANSFORMABLE_EXT.test(input.filename)) return false
  // Skip files inside node_modules — they cannot contain user-authored
  // className strings we care about, and parsing third-party TS (e.g.
  // expo-modules-core's declaration files) with our minimal plugin set
  // ('jsx', 'typescript') breaks on syntax we don't enable (decorators,
  // etc.) and would crash bundling.
  if (input.filename.includes('/node_modules/')) return false
  // Cheap source-level guard: no `className` token → nothing to rewrite.
  // Avoids parsing the entire app on every change.
  if (!input.src.includes('className')) return false
  return true
}

export { transformClassNames } from './transform-classnames.js'
