// Single source of truth for "are we running on web?" used by runtime helpers
// (styledComponent, useLunarCSS). The Metro transformer makes a SEPARATE
// build-time platform decision via input.options.platform — see
// metro/transformer.ts. Runtime detection here is for code paths that ship
// in both web and native bundles.
//
// Detection order:
//   1. Expo's `process.env.EXPO_OS` ("web" / "ios" / "android"). Set by Expo
//      Metro at bundle time, so on web bundles this is the literal string
//      "web" embedded in the build — no runtime indirection.
//   2. typeof document/window — falls back to a generic browser sniff for
//      non-Expo web targets (CRA, Next.js).
//   3. Default false (assume native).

const expoOs =
  typeof process !== 'undefined' && process.env
    ? (process.env.EXPO_OS as string | undefined)
    : undefined

export const isWeb: boolean =
  expoOs === 'web' ||
  (expoOs === undefined &&
    typeof document !== 'undefined' &&
    typeof window !== 'undefined' &&
    typeof (window as { navigator?: unknown }).navigator !== 'undefined')
