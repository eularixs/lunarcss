// Placeholder: Babel plugin entry. Per Risk #1 the canonical transform path
// is the Metro transformer (src/metro/transformer.ts). This module is kept so
// users on bundlers without Metro (RN Bare custom, RN-Web with Webpack) can
// opt into a Babel-only transform. Implementation pending.

import type { PluginObj } from '@babel/core'

export interface LunarBabelOptions {
  intrinsics?: readonly string[]
  helpers?: readonly string[]
  components?: readonly string[]
}

export default function lunarBabelPlugin(_options: LunarBabelOptions = {}): PluginObj {
  return {
    name: 'lunarcss',
    visitor: {},
  }
}
