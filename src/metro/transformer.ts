// Metro-compatible babel transformer.
// Runs LunarCSS className → __lcssTw() rewrite at the file source level (Risk #1)
// then delegates to the user's upstream transformer (default @react-native/metro-babel-transformer).
//
// `babelTransformerPath` in metro.config.js must point to the built file:
//   require.resolve('lunarcss/metro/transformer')

import { createRequire } from 'node:module'
import { transformClassNames } from './transform-classnames.js'

const TRANSFORMABLE_EXT = /\.(?:[mc]?js|[mc]?jsx|tsx?)$/

interface MetroTransformInput {
  src: string
  filename: string
  options?: { projectRoot?: string; [k: string]: unknown }
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

  if (!TRANSFORMABLE_EXT.test(input.filename)) {
    return upstream.transform(input)
  }

  const { code } = transformClassNames({ src: input.src, filename: input.filename })
  return upstream.transform({ ...input, src: code })
}

export { transformClassNames } from './transform-classnames.js'
