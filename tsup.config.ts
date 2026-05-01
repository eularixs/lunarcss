import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'index.web': 'src/index.web.ts',
    'metro/config': 'src/metro/config.ts',
    'metro/transformer': 'src/metro/transformer.ts',
    'web/plugin': 'src/web/plugin.ts',
    'types/index': 'src/types/index.ts',
    'runtime/tw': 'src/runtime/tw.ts',
    'runtime/tw.web': 'src/runtime/tw.web.ts',
    'cli/index': 'src/cli/index.ts',
    __theme__: 'src/__theme__.ts',
  },
  format: ['esm'],
  target: 'es2022',
  platform: 'neutral',
  treeshake: true,
  splitting: false,
  minify: false,
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-native',
    'react-native-web',
    '@babel/parser',
    '@babel/generator',
    '@babel/traverse',
    '@babel/types',
    'postcss',
    // Must stay external: Metro's resolveRequest in withLunarCSS swaps this
    // bare specifier to the user's generated .lunarcss/__theme__.js at bundle
    // time. If tsup inlines it here, the bundle ships with the empty default
    // tokens and Metro never gets a chance to redirect.
    'lunarcss/__theme__',
  ],
})
