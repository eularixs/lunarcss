// Lazy-load react-native so the package can build on systems without RN
// installed (e.g. CI for web-only consumers). At runtime in an RN app the
// import resolves normally.

import type { RuntimeContext, Platform, ColorScheme } from './types.js'
import { setRuntimeContextProvider } from './context.js'
import { invalidateTokens } from './cache.js'
import { themeEmitter } from './emitter.js'

let initialized = false

export function initNativeBridge(): void {
  if (initialized) return
  initialized = true

  let RN: typeof import('react-native') | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RN = require('react-native') as typeof import('react-native')
  } catch {
    return
  }

  const { Platform: RNPlatform, Appearance, Dimensions } = RN

  const platform: Platform =
    RNPlatform.OS === 'ios' || RNPlatform.OS === 'android' || RNPlatform.OS === 'web'
      ? RNPlatform.OS
      : 'web'

  let colorScheme: ColorScheme =
    (Appearance.getColorScheme() ?? 'light') === 'dark' ? 'dark' : 'light'

  let width = Dimensions.get('window').width

  Appearance.addChangeListener(({ colorScheme: scheme }) => {
    const next: ColorScheme = scheme === 'dark' ? 'dark' : 'light'
    if (next === colorScheme) return
    colorScheme = next
    // Color-scheme change requires busting cache entries that depend on it.
    // Rather than tracking modifier usage, bump theme via a synthetic token.
    invalidateTokens(['__color-scheme__'])
    themeEmitter.emit()
  })

  Dimensions.addEventListener('change', ({ window }) => {
    width = window.width
    invalidateTokens(['__viewport__'])
    themeEmitter.emit()
  })

  setRuntimeContextProvider(
    (): RuntimeContext => ({
      platform,
      colorScheme,
      width,
      state: {},
    }),
  )
}
