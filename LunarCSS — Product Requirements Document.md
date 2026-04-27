# LunarCSS — Product Requirements Document

**Version:** 1.0.0
**Author:** Eularix Team
**Status:** Ready for Development

***

## 1. Overview

### Vision

LunarCSS is a styling engine for React Native and Web that is plug-and-play, zero-config, and fully compatible with Tailwind CSS v4. Built on top of a forked and modernized TWRNC with a Tailwind v4 architecture upgrade, plus a JSX transform layer so users can write `className` just like on the web.

### Positioning

> "The only React Native styling engine with native Tailwind v4 support. Zero config, plug and play."

***

## 2. Problem Statement

| Problem | Current State | LunarCSS Solution |
| :-- | :-- | :-- |
| NativeWind setup is complex | 6+ manual steps, Reanimated required | `lunar init --css` single command |
| TWRNC does not support Tailwind v4 | Locked to v3, new features unavailable | Fork + native port to v4 |
| TWRNC has no web support | Mobile only | Platform-aware passthrough to Tailwind CSS |
| TWRNC resolves at runtime | Compute on every render | Build-time extraction + static cache |
| Reanimated conflict | NativeWind JSX transform clashes | Simple Babel plugin, zero conflict |
| Dynamic theming is difficult | Static config only | Reactive CSS variables via `@theme` |
| Keeping up with Tailwind updates is painful | Full manual rewrite per update | Modular utility groups, easy to sync |


***

## 3. Architecture

```
┌─────────────────────────────────────────────┐
│                  User Code                  │
│     <Text className="text-primary px-4" />  │
└────────────────────┬────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │   Babel/Metro       │
          │   JSX Transform     │  ← Transform layer
          │  className → tw()   │
          └──────────┬──────────┘
                     │
        ┌────────────▼───────────┐
        │   Platform Detection   │
        └────┬──────────────┬────┘
             │              │
    ┌────────▼───┐    ┌──────▼──────┐
    │   Mobile   │    │    Web      │
    │  Resolver  │    │ className   │
    │  (forked   │    │ passthrough │
    │   TWRNC)   │    │ → Tailwind  │
    └────────────┘    └─────────────┘
             │
    ┌────────▼───────────┐
    │  StyleSheet.create │
    │  + Static Cache    │
    └────────────────────┘
```


***

## 4. TWRNC Fork Strategy

### 4.1 Why Fork, Not Wrap

TWRNC upstream has no roadmap to support Tailwind v4 — an open issue has existed since January 2025 with no resolution. Wrapping TWRNC means staying locked to Tailwind v3 indefinitely. Forking provides full control to:

- Port to Tailwind v4 immediately
- Maintain independently according to the Lunar ecosystem roadmap
- Apply optimizations that are not possible without access to internals


### 4.2 Architectural Changes from TWRNC

| Component | TWRNC Original | LunarCSS Fork |
| :-- | :-- | :-- |
| Config source | `tailwind.config.js` + `resolveConfig()` | `@theme` CSS blocks + CSS custom properties |
| Color system | sRGB hex only | OKLCH → auto convert to RN-compatible |
| Utility resolution | Runtime compute on every call | Build-time extraction + O(1) Map lookup |
| Web support | None | Platform-aware passthrough |
| StyleSheet output | Plain JS object | `StyleSheet.create()` — validated and cached at native layer |
| Update mechanism | Manual full rewrite | Modular per utility group |

### 4.3 Update Strategy When Tailwind Releases a New Version

Utility mappings are split into independent groups so that when Tailwind updates, only the affected groups need to be ported:

```
src/resolver/v4/utilities/
├── spacing.ts        ← p-, m-, gap-, inset-
├── typography.ts     ← text-, font-, leading-
├── colors.ts         ← bg-, text-, border- colors
├── layout.ts         ← flex, grid, display, position
├── sizing.ts         ← w-, h-, min-, max-
├── borders.ts        ← rounded-, border-
├── effects.ts        ← shadow-, opacity-, blur-
├── transforms.ts     ← rotate-, scale-, translate- (including 3D in v4)
├── containers.ts     ← @container queries (new in v4)
└── index.ts          ← aggregate all utilities
```

**Update workflow when a new Tailwind version is released:**

1. Run diff script against Tailwind changelog
2. Identify which utility groups changed
3. Update only the relevant files
4. Re-run test suite per group
```ts
// scripts/sync-tailwind.ts
async function diffTailwindUtilities(fromVersion: string, toVersion: string) {
  // fetch both versions, compare utility list
  // output: { added: [], removed: [], changed: [] }
}
```


### 4.4 TWRNC Known Issues Fixed in This Fork

**Issue 1 — Runtime performance:**
TWRNC computes a style object every time `tw()` is called. On low-end devices this is a bottleneck since it happens on every render.
**Fix:** Static build-time extraction + persistent Map cache.

**Issue 2 — Tailwind v4 incompatibility:**
TWRNC uses `resolveConfig()` from `tailwindcss` v3. In v4 this API is removed entirely, replaced by CSS-first `@theme` blocks.
**Fix:** Write a dedicated `@theme` CSS parser.

**Issue 3 — No web support:**
TWRNC only returns RN StyleSheet objects, no web path exists.
**Fix:** Platform detection before resolution — passthrough `className` on web.

**Issue 4 — OKLCH colors not supported in RN:**
Tailwind v4 defaults to OKLCH color space. RN only supports hex/rgb.
**Fix:** Auto-convert using `culori` library (2kb, zero dependencies).

**Issue 5 — Inconsistent arbitrary value parsing:**
TWRNC supports `bg-[#fff]` but is inconsistent across all arbitrary value patterns.
**Fix:** Robust arbitrary value parser covering all Tailwind v4 patterns.

**Issue 6 — No platform modifiers:**
TWRNC has no `ios:`, `android:`, or `web:` modifiers.
**Fix:** Platform-aware modifier resolution layer.

**Issue 7 — Dark mode is not reactive:**
TWRNC supports dark mode but does not auto-update when the user switches themes on their device.
**Fix:** Hook into `Appearance.addChangeListener`, selectively invalidate cache on change.

**Issue 8 — StyleSheet.create not used:**
TWRNC returns plain JS objects, not `StyleSheet.create()` output. RN validates and caches StyleSheet objects at the native layer for better efficiency.
**Fix:** Wrap all resolver output with `StyleSheet.create()`.

***

## 5. Core Features

### 5.1 JSX Transform (className → tw())

**Behavior:**

```ts
// User writes
<Text className="text-sm font-bold text-primary" />

// Auto-transformed to
<Text style={__lcssTw("text-sm font-bold text-primary")} />
```

**Requirements:**

- Transform only the `className` attribute — do not touch any other props
- Auto-inject `__lcssTw` import if not already present in the file
- Handle dynamic className:

```ts
<View className={isActive ? "bg-primary" : "bg-zinc-100"} />
// → style={__lcssTw(isActive ? "bg-primary" : "bg-zinc-100")}
```

- Handle merge with existing `style` prop:

```ts
<View className="px-4" style={{ opacity: 0.5 }} />
// → style={[__lcssTw("px-4"), { opacity: 0.5 }]}
```

- Handle template literals — skip build-time extraction, resolve at runtime with cache:

```ts
<View className={`bg-${color}-500 p-4`} />
```

- Skip transform for DOM elements (`div`, `span`, `p`, etc.) on web — leave `className` as-is
- Zero conflict with Reanimated — does not use `jsxImportSource`


### 5.2 Tailwind v4 Resolver

**@theme parser:**

```css
/* lunar.css */
@import "lunarcss";

@theme {
  --color-primary: oklch(0.6 0.2 264);
  --color-secondary: #f59e0b;
  --spacing-xs: 4px;
  --font-size-display: 48px;
  --border-radius-card: 16px;
}
```

All custom tokens are immediately available as classes:

```tsx
<View className="bg-primary p-xs rounded-card" />
<Text className="text-display text-secondary" />
```

**Caching strategy:**

```ts
const styleCache = new Map<string, StyleSheet>()

function resolveTw(className: string) {
  if (styleCache.has(className)) return styleCache.get(className)!
  const resolved = StyleSheet.create({ s: parseAndResolve(className) }).s
  styleCache.set(className, resolved)
  return resolved
}
```

**Build-time extraction:**

```ts
// Babel second pass — scan all static string classNames
// Pre-generate:
export const LCSS_STATIC = StyleSheet.create({
  "text-sm font-bold": { fontSize: 14, fontWeight: '700' },
  "bg-primary px-4": { backgroundColor: '#6366f1', paddingHorizontal: 16 }
})
// Runtime: O(1) lookup, zero compute
```


### 5.3 Web Layer

On web (`Platform.OS === 'web'`):

- Babel transform is skipped — `className` is passed as-is to the DOM
- Tailwind CSS handles rendering via the browser CSS engine
- LunarCSS exports as a Tailwind CSS plugin to sync tokens:

```css
/* global.css (Next.js) */
@import "tailwindcss";
@plugin "lunarcss";
```

Result: mobile and web share the same design tokens, but use different rendering engines — zero duplication.

### 5.4 Dual Tailwind Version Support

```ts
export function createResolver() {
  const twVersion = getTailwindVersion()

  if (twVersion >= 4) return new V4Resolver()
  return new V3Resolver() // TWRNC-based fallback for existing projects
}
```

Fully transparent to the user — no configuration required.

### 5.5 Dynamic Theming (Lunar Colony)

```ts
import { updateTheme } from 'lunarcss'

// User changes theme in low-code builder → inject into runtime
updateTheme({
  '--color-primary': '#ef4444',
  '--color-secondary': '#8b5cf6'
})
// All components using these tokens auto re-render
```

Implementation: selectively invalidate cache only for classes that use the changed tokens.

### 5.6 Platform Modifiers

```tsx
<View className="ios:pt-12 android:pt-8 web:pt-6" />
<View className="dark:bg-zinc-900 light:bg-white" />
<Text className="sm:text-sm md:text-base lg:text-lg" />
<Button className="active:opacity-70 disabled:opacity-30" />
```

Supported modifiers:

- `ios:` `android:` `web:` — platform (resolved at build-time when static)
- `dark:` `light:` — color scheme (reactive via `Appearance.addChangeListener`)
- `sm:` `md:` `lg:` `xl:` — responsive (via `useWindowDimensions`)
- `active:` `disabled:` `focus:` — state (via component state prop injection)


### 5.7 Animations — Out of Scope but Documented

LunarCSS does not handle animations. Official recommendations:

- **`react-native-ease`** — zero JS overhead, uses native platform APIs (iOS Core Animation), no extra setup required
- **`react-native-reanimated`** — for complex animations, optional peer dependency
- **React Native Animated API** — built-in, suitable for simple animations

`animate-` classes from Tailwind are silently skipped with a dev-mode warning.

***

## 6. CLI — `lunar` Command

### `lunar init --css`

```bash
lunar init --css
```

Auto-detects project type and configures everything:

```
lunar init --css
      │
      ├─ Detect: Expo? Next.js? RN Bare?
      │
      ├─ Expo
      │   ├─ Inject babel plugin into babel.config.js
      │   ├─ Create/update metro.config.js
      │   ├─ Generate lunar.css
      │   ├─ Add import in app/_layout.tsx or App.tsx
      │   └─ Verify react-native-web if web target exists
      │
      ├─ Next.js
      │   ├─ Inject turbopack resolveAlias (react-native → react-native-web)
      │   ├─ Inject transpilePackages
      │   ├─ Detect Tailwind v3 vs v4, setup accordingly
      │   ├─ Merge @plugin "lunarcss" into global.css (merge, never overwrite)
      │   └─ Verify react-native-web is installed
      │
      └─ RN Bare
          ├─ Inject babel plugin into babel.config.js
          ├─ Create/update metro.config.js
          └─ Generate lunar.css
```

**Generated files:**

```ts
// lunar.config.ts (optional)
import { defineConfig } from 'lunarcss'

export default defineConfig({
  theme: {
    extend: {
      colors: { primary: 'oklch(0.6 0.2 264)' }
    }
  }
})
```

```css
/* lunar.css */
@import "lunarcss";

@theme {
  /* Add your custom tokens here */
  --color-primary: oklch(0.6 0.2 264);
}
```


### `lunar init` (Full Ecosystem)

Sets up LunarCSS + Lunar Kit components together — the entry point to the entire Lunar ecosystem.

***

## 7. Package Structure

```
lunarcss/
├── src/
│   ├── babel-plugin/
│   │   ├── index.ts              ← JSX transform
│   │   ├── auto-import.ts        ← inject __lcssTw import
│   │   └── build-extractor.ts    ← static string extraction
│   ├── metro/
│   │   ├── transformer.ts        ← CSS file transformer
│   │   └── config.ts             ← Metro config helper
│   ├── resolver/
│   │   ├── index.ts              ← resolver factory + version detection
│   │   ├── v4/
│   │   │   ├── parser.ts         ← @theme CSS parser
│   │   │   ├── utilities/
│   │   │   │   ├── spacing.ts
│   │   │   │   ├── typography.ts
│   │   │   │   ├── colors.ts     ← OKLCH converter
│   │   │   │   ├── layout.ts
│   │   │   │   ├── sizing.ts
│   │   │   │   ├── borders.ts
│   │   │   │   ├── effects.ts
│   │   │   │   ├── transforms.ts
│   │   │   │   ├── containers.ts
│   │   │   │   └── index.ts
│   │   │   └── cache.ts
│   │   └── v3/                   ← TWRNC-based fallback
│   ├── web/
│   │   ├── passthrough.ts
│   │   └── plugin.ts             ← Tailwind CSS plugin
│   ├── runtime/
│   │   ├── tw.ts                 ← main __lcssTw() function
│   │   ├── theme.ts              ← updateTheme() dynamic theming
│   │   ├── platform.ts           ← platform modifier resolution
│   │   └── responsive.ts         ← breakpoint resolution
│   ├── cli/
│   │   ├── index.ts
│   │   ├── init.ts
│   │   ├── detect.ts
│   │   └── templates/
│   │       ├── expo/
│   │       ├── nextjs/
│   │       └── bare/
│   └── index.ts
├── tsup.config.ts
└── package.json
```


***

## 8. Build \& Bundle Requirements

```ts
// tsup.config.ts
export default {
  entry: {
    index: 'src/index.ts',
    'babel-plugin': 'src/babel-plugin/index.ts',
    'metro/config': 'src/metro/config.ts',
    'web/plugin': 'src/web/plugin.ts',
  },
  format: ['esm'],
  treeshake: true,
  minify: true,
  dts: true,
}
```

```json
{
  "sideEffects": false,
  "exports": {
    ".": "./dist/index.js",
    "./babel-plugin": "./dist/babel-plugin.js",
    "./metro/config": "./dist/metro/config.js",
    "./web/plugin": "./dist/web/plugin.js"
  }
}
```

**Size targets:**


| Bundle | Target |
| :-- | :-- |
| Core runtime | < 10kb gzipped |
| Babel plugin | < 5kb gzipped |
| Full package | < 20kb gzipped |


***

## 9. Compatibility Matrix

| Platform | Support | Notes |
| :-- | :-- | :-- |
| Expo Go | ✅ Full | Pure JS, zero JSI — must work |
| Expo Dev Build | ✅ Full |  |
| RN Bare 0.73+ | ✅ Full |  |
| Next.js 14+ App Router | ✅ Full |  |
| Next.js Pages Router | ✅ Full |  |
| Tailwind v3 | ✅ Via V3Resolver | Auto fallback |
| Tailwind v4 | ✅ Native | Primary target |
| New Architecture (Fabric) | ✅ | StyleSheet.create compatible |
| React Native Web | ✅ | Required only for web target |

**Zero required peer dependencies** — all optional:

- `react-native-reanimated` — optional, for animations
- `react-native-web` — optional, only when web target is needed

***

## 10. Known Edge Cases \& Solutions

| Edge Case | Solution |
| :-- | :-- |
| OKLCH not supported in RN | Auto-convert to nearest sRGB hex via `culori` |
| Dynamic className with template literals | Skip build-time, resolve at runtime with cache |
| `className` + `style` prop used together | Merge: `[resolvedTw, existingStyle]` |
| PostCSS conflict with existing Tailwind in Next.js | `lunar init` detects and merges, never overwrites |
| `className` on third-party library components | Babel plugin only transforms known RN native elements |
| Dark mode not reactive | Hook into `Appearance.addChangeListener`, invalidate cache |
| Tailwind v4 breaking changes in new release | Modular utility groups — update per group, not a full rewrite |
| `animate-` classes used by user | Skip resolve + dev warning: "Use react-native-ease for animations" |
| Old Expo SDK | CLI checks SDK version, warns and suggests upgrade if < SDK 50 |
| Complex arbitrary values `bg-[url(...)]` | Not supported on mobile, skip with warning |


***

## 11. Out of Scope — v1

- Built-in animations (delegate to react-native-ease / Reanimated)
- Container query runtime support on mobile
- Prettier plugin for className sorting
- VSCode IntelliSense extension
- Storybook integration
- `color-mix()` on mobile (complex, deferred to v2)
- CSS Grid on mobile (not supported by RN)

