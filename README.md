# LunarCSS

> Plug-and-play Tailwind v4 styling engine for React Native and Web. Zero-config. One source of truth.

[![tests](https://img.shields.io/badge/tests-306%20passing-brightgreen)]() [![core](https://img.shields.io/badge/core-11.17kb%20gzip-blue)]() [![license](https://img.shields.io/badge/license-MIT-blue)]()

---

## Why

| Problem | LunarCSS |
| :-- | :-- |
| NativeWind setup is complex | `lunar-css init` — single command |
| TWRNC is locked to Tailwind v3 | Native Tailwind v4 support |
| TWRNC has no web support | Same `className` works on RN + Web |
| TWRNC resolves at runtime every render | Build-time extraction + LRU cache |
| Reanimated conflict via JSX transform | Metro-layer transform — zero clash |
| Static themes only | Reactive CSS variables via `lunar.config.ts` |
| Manual rewrite per Tailwind update | Modular utility groups |

---

## Install

```bash
pnpm add lunar-css
# or
npm install lunar-css
# or
yarn add lunar-css
```

Peer dependencies (auto-install or already present):

- `react` `>=18`
- `react-native` `>=0.73` (optional — only for native targets)
- `postcss` `>=8.4` (optional — only for web targets)

---

## Quick Start

### Expo

```bash
cd my-expo-app
npx lunar-css init
```

Generates:

```
lunar.config.ts        # token source of truth
metro.config.js        # withLunarCSS wrapped (or merged into existing)
.gitignore             # .lunar-css/ ignored
tsconfig.json          # types: ["lunar-css/types"] appended
```

Use `className` on any RN component:

```tsx
import { View, Text } from 'react-native'

export default function Screen() {
  return (
    <View className="flex-1 items-center justify-center bg-zinc-900">
      <Text className="text-2xl font-bold text-white">Hello LunarCSS</Text>
    </View>
  )
}
```

### React Native (bare)

```bash
cd my-rn-app
npx lunar-css init
```

Same outputs as Expo, but `metro.config.js` uses `@react-native/metro-config` + `mergeConfig`.

### Next.js

```bash
cd my-next-app
npx lunar-css init
```

Generates:

```
lunar.config.ts        # same template as native
app/globals.css        # @import "tailwindcss" + @plugin "lunar-css"
.gitignore
tsconfig.json
```

Add the PostCSS plugin to `postcss.config.js`:

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'lunar-css': {},
  },
}
```

(Or use `lunar-css/web/plugin` directly — see [Web Plugin](#web-plugin).)

Import `app/globals.css` from your root layout:

```tsx
// app/layout.tsx
import './globals.css'
```

Use `className` like usual — Tailwind compiles it, your custom tokens work cross-platform.

---

## Web vs Native behavior

LunarCSS runs the **same engine on web and native**: the Metro transformer rewrites `className` to `style={__lcssTw(...)}` on every platform, the resolver translates the class string into an RN style object, and react-native-web turns that style object into atomic CSS at render time.

| Concern | Native (iOS / Android) | Web |
| :-- | :-- | :-- |
| `className` | Rewritten by Metro transformer to `style={__lcssTw('...')}`. | Same rewrite. |
| `__lcssTw(cls)` | Returns RN style object: `{ backgroundColor, padding, ... }`. | Same — RN-Web emits atomic CSS from the result. |
| `tw(cls)` | Alias for `__lcssTw`. | Same. |
| `useLunarCSS().tw` / `.token` | Reads the global token registry. | Same registry (`globalThis.__LUNARCSS_RUNTIME__`). |
| `vars.<name>` / `lunarTheme(spec)` | Resolves via namespace probe. | Same. |
| `styledComponent(C)` | Converts each className prop to its style counterpart. | Same. |

**Why not Tailwind CSS on web?** react-native-web's `View` / `Text` / `Pressable` / etc. strip the `className` prop at render time (`forwardedProps.defaultProps` allowlist does not include it). Even when Tailwind generates the matching CSS rules, the class never reaches the DOM, so nothing applies. Patching RN-Web's allowlist post-load is too late — `View` captures `forwardPropsList` at module init via `Object.assign`. Running the lunar resolver on web sidesteps the issue entirely: one engine, one source of truth, no Tailwind dependency.

**Coverage**: the lunar resolver supports the same utility set across platforms — spacing, colors (Tailwind v3 palette + custom tokens), layout, sizing, typography, borders, effects, transforms, transitions, containers, plus the full modifier chain (`dark:` / `ios:` / `web:` / `active:` / `sm:` ...).

---

## Multi-style components

The transformer rewrites every whitelisted RN component automatically. For
multi-style-prop components, lunarcss exposes a sibling `<x>ClassName` prop
per `<x>Style`:

```tsx
<ScrollView
  className="flex-1 bg-zinc-950"           // → style
  contentContainerClassName="p-card gap-4"  // → contentContainerStyle
/>

<ImageBackground
  className="flex-1"            // → style
  imageClassName="opacity-50"   // → imageStyle
  source={...}
/>

<FlatList
  className="flex-1"
  contentContainerClassName="p-4"
  data={...}
/>
```

Whitelisted intrinsics (transformer rewrites for free):
`View`, `Text`, `Image`, `ImageBackground`, `ScrollView`, `FlatList`,
`SectionList`, `VirtualizedList`, `TextInput`, `TouchableOpacity`,
`TouchableHighlight`, `TouchableWithoutFeedback`, `Pressable`,
`SafeAreaView`, `Modal`, `ActivityIndicator`, `KeyboardAvoidingView`,
`Switch`.

---

## `styledComponent` — escape hatch

For third-party components NOT in the whitelist (LinearGradient, BlurView,
your own design-system primitives), wrap with `styledComponent`:

```tsx
import { styledComponent } from 'lunar-css'
import { LinearGradient as _LinearGradient } from 'expo-linear-gradient'

const LinearGradient = styledComponent(_LinearGradient)

// Usage — works on native AND web:
<LinearGradient className="rounded-card overflow-hidden" colors={[...]} />
```

For multi-style-prop components, declare the style props:

```tsx
import { BlurView as _BlurView } from 'expo-blur'

const BlurView = styledComponent(_BlurView, {
  styleProps: ['style', 'tintStyle'],
})

// Now both class props are supported:
<BlurView className="rounded-card" tintClassName="bg-zinc-900/60" />
```

**Migration from inline `className`-on-custom-component:** if you have a
component that already accepts a `className` string prop and forwards it
to a child, leave it alone — `styledComponent` is only needed for
components that consume RN style objects directly.

---

## Programmatic APIs

For values you can't pass through JSX `className` (StatusBar, navigation
themes, animated values), use:

### `useLunarCSS()`

```tsx
import { useLunarCSS } from 'lunar-css'

function Screen() {
  const { tw, token } = useLunarCSS()
  return (
    <>
      <StatusBar backgroundColor={token('--color-primary')} />
      <Animated.View style={tw('bg-primary p-card')} />
    </>
  )
}
```

### `vars`

Typed token accessor backed by the live registry:

```tsx
import { vars } from 'lunar-css'

vars.primary  // "#6366f1"
vars.accent   // "#f59e0b"
vars.card     // "24px"  — bare names probe color → spacing → radius → text → width
```

### `lunarTheme(spec)`

Map logical names to resolved token values. Useful for libraries that take
theme objects (React Navigation, Reanimated, etc.):

```tsx
import { lunarTheme } from 'lunar-css'
import { ThemeProvider } from '@react-navigation/native'

const NavTheme = {
  dark: true,
  colors: lunarTheme({
    primary: '--color-primary',
    background: '--color-surface',
    card: 'surface',     // bare name → namespace probe
    text: 'primary',
    border: 'muted',
    notification: 'accent',
  }),
}

<ThemeProvider value={NavTheme}>...</ThemeProvider>
```

---

## `lunar.config.ts`

Single source of truth. Read by Metro at config time on native, by PostCSS at build time on web.

```ts
import { defineConfig } from 'lunar-css'

export default defineConfig({
  theme: {
    extend: {
      colors: {
        primary: 'oklch(0.6 0.2 264)',
        accent: '#f59e0b',
      },
      spacing: {
        xs: '4px',
        card: '24px',
      },
      borderRadius: {
        card: '14px',
      },
      fontSize: {
        display: ['48px', '52px'], // [size, lineHeight]
      },
      width: {
        card: '320px',
      },
    },
  },
})
```

### Token namespace map

| `theme.extend.<ns>` | CSS prefix | Class form |
| :-- | :-- | :-- |
| `colors` | `--color-` | `bg-primary`, `text-accent`, `border-primary` |
| `spacing` | `--spacing-` | `p-card`, `mt-xs`, `gap-card` |
| `fontSize` | `--text-` (+ tuple → `--text-{n}--line-height`) | `text-display` |
| `fontWeight` | `--font-weight-` | `font-{name}` |
| `fontFamily` | `--font-family-` | `font-[name]` |
| `borderRadius` | `--radius-` | `rounded-card` |
| `width` / `height` / `min-w` / `max-w` / etc | matching prefix | `w-card`, `min-h-screen` |
| `letterSpacing` | `--tracking-` | `tracking-{name}` |
| `lineHeight` | `--leading-` | `leading-{name}` |

### Escape hatch — flat tokens

```ts
export default defineConfig({
  theme: {
    tokens: {
      '--color-primary': '#6366f1',
      '--my-custom-token': '42px',
    },
  },
})
```

Flat `tokens` overrides namespaced values when both define the same key.

---

## CLI — `lunar-css init`

Auto-detects project type and configures everything:

```bash
npx lunar-css init           # detect + configure
npx lunar-css init --dry-run # preview without writing
npx lunar-css --version
npx lunar-css --help
```

Detection:

- `dependencies.expo` → Expo (with SDK version warning if `< 50`)
- `dependencies.next` → Next.js
- `dependencies.react-native` (no expo, no next) → RN Bare
- otherwise → exits with error

### Idempotent re-run

| File | First run | Re-run |
| :-- | :-- | :-- |
| `lunar.config.ts` | `created` | `skipped-existing` (never overwrites user edits) |
| `metro.config.js` | `created` or `merged` (AST inject) | `unchanged` (substring match) |
| `app/globals.css` | `created` or `merged` (block prepended) | `unchanged` (marker comment match) |
| `.gitignore` | `created` or `updated` | `unchanged` (header sentinel match) |
| `tsconfig.json` | `updated` (types appended) | `unchanged` |

Status legend: `[+]` created · `[~]` updated · `[=]` unchanged · `[s]` skipped-existing.

### AST merge (existing `metro.config.js`)

Input:

```js
const { getDefaultConfig } = require('expo/metro-config')
const config = getDefaultConfig(__dirname)
config.resolver.assetExts.push('lottie')
module.exports = config
```

Output:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withLunarCSS } = require('lunar-css/metro');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('lottie');
module.exports = withLunarCSS(config);
```

Existing user code preserved — only the wrap + import are added.

---

## Web Plugin

The `lunar-css/web/plugin` PostCSS plugin reads `lunar.config.ts` at build time and emits an `@theme {}` block before `@import "tailwindcss"`.

```js
// postcss.config.js
const lunarcss = require('lunar-css/web/plugin')

module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
    lunarcss(),
  ],
}
```

Or with options:

```js
lunarcss({
  configFile: '/abs/path/to/lunar.config.ts', // override discovery
  projectRoot: process.cwd(),                  // override cwd
  passthrough: false,                          // run-but-emit-nothing for debugging
})
```

### What it injects

Input:

```css
/* LunarCSS */
@import "tailwindcss";
@plugin "lunar-css";
```

Output (with `colors.primary = '#6366f1'`, `spacing.xs = '4px'`):

```css
/* LunarCSS */
/* lunarcss:emitted */
@theme {
  --color-primary: #6366f1;
  --spacing-xs: 4px
}
@import "tailwindcss";
@plugin "lunar-css";
```

### Hot-reload

The plugin pushes a `type: 'dependency'` PostCSS message pointing at `lunar.config.ts`. Next.js / Vite / Webpack honor this — editing `lunar.config.ts` re-runs PostCSS on dependent CSS files.

`jiti` runs with `moduleCache: false` and `fsCache: false` — no stale config across reads.

### Idempotency

Re-running PostCSS on already-emitted output is a no-op — the `/* lunarcss:emitted */` marker comment short-circuits injection.

---

## Utility Class Reference

All groups support arbitrary brackets `[...]`, named tokens (where applicable), and Tailwind v4 modifiers (`dark:`, `ios:`, `sm:`, `active:`, etc).

### Spacing

`p-{n}` `px-{n}` `py-{n}` `pt/r/b/l-{n}` · `m-{n}` `mx/my/mt/mr/mb/ml-{n}` · `gap-{n}` `gap-x-{n}` `gap-y-{n}` · `inset-{n}` `top/right/bottom/left-{n}`

Values: numeric (× `--spacing` base = 4px default), named tokens (`p-card`), arbitrary (`p-[10px]`, `p-[1rem]`), fractions (`p-1/2` → 50%), keywords (`auto`, `full`, `px`).

Negative supported: `-mt-4`.

### Colors

`bg-*` `text-*` `border-*` `ring-*` `shadow-*` `tint-*` `placeholder-*`

Values: named token (`bg-primary` via `--color-primary`), CSS keywords (`black`, `white`, `transparent`, `current`, `inherit`), arbitrary hex / OKLCH (`bg-[#fff]`, `bg-[oklch(0.6_0.15_264)]`).

Opacity: `bg-primary/50` → `rgba(...)` automatically.

OKLCH on mobile: auto-converted to nearest sRGB hex via `culori`. Out-of-gamut values clamp with a dev warning.

### Layout

`flex` `hidden` · `flex-row` `flex-col` `flex-row-reverse` `flex-col-reverse` · `flex-wrap` `flex-nowrap` `flex-wrap-reverse` · `flex-1` `flex-auto` `flex-initial` `flex-none` `flex-grow` `flex-grow-0` `flex-shrink` `flex-shrink-0` `grow` `shrink` · `items-{start/end/center/baseline/stretch}` · `justify-{start/end/center/between/around/evenly}` · `self-{auto/start/end/center/stretch/baseline}` · `content-{start/end/center/between/around/stretch}` · `absolute` `relative` `static` · `overflow-{hidden/visible/scroll}` · `z-{n}` · `flex-{n}` (numeric)

### Sizing

`w-*` `h-*` `min-w-*` `max-w-*` `min-h-*` `max-h-*` `size-*`

Values: numeric × spacing base, fractions, `full` `auto` `screen` `px`, arbitrary, namespaced tokens (`w-card` → `--width-card`, falls back to `--spacing-card`).

### Typography

`text-{xs..9xl}` size scale · `text-[18px]` arbitrary · `text-{display}` token (`--text-display`)

`font-{thin/extralight/light/normal/medium/semibold/bold/extrabold/black}` · `font-[Inter]` family

`leading-{none/tight/snug/normal/relaxed/loose}` (multiplier — auto-resolves with co-occurring `text-*`) · `leading-{n}` numeric · `leading-[20px]` arbitrary

`tracking-{tighter/tight/normal/wide/wider/widest}` · `tracking-[2px]`

`text-{left/center/right/justify}` · `italic` `not-italic` · `underline` `line-through` `no-underline` · `uppercase` `lowercase` `capitalize` `normal-case`

### Borders

`rounded` `rounded-{none/sm/md/lg/xl/2xl/3xl/full}` · `rounded-{t/r/b/l/tl/tr/br/bl}-*` · `rounded-card` (token via `--radius-card`) · `rounded-[10px]`

`border` `border-{0/2/4/8}` · `border-{t/r/b/l}-*` · `border-{solid/dashed/dotted}`

### Effects

`opacity-{0/5/10/.../100}` · `opacity-[0.42]`

`shadow` `shadow-{none/sm/md/lg/xl/2xl}` — emits RN-compatible `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` + Android `elevation` together.

### Transforms

`translate-x-{n}` `translate-y-{n}` `translate-{n}` (both axes) · `-translate-x-{n}` (negative) · `translate-x-card` (token) · `translate-x-1/2` (fraction → %) · `translate-x-[20px]` (arbitrary)

`rotate-{n}` (deg) · `rotate-x/y/z-{n}` (3D) · `rotate-[0.25turn]`

`scale-{n}` (n/100) · `scale-x/y-{n}` · `-scale-x-100` (mirror) · `scale-[1.2]`

`skew-x/y-{n}` · `transform` (Tailwind enable-flag, no-op on RN) · `transform-none`

Multiple transform classes merge into one `transform: [...]` array, in className order.

### Transitions

CSS-style transition utilities. Output keys (`transitionProperty`, `transitionDuration`, `transitionDelay`, `transitionTimingFunction`) match `react-native-web` conventions: native View/Text silently ignore them; the web build wires them up automatically; an Animated/Reanimated layer can read them off `style` to drive its own animations.

Property groups:

`transition` (default — color, bg, border, opacity, transform, shadow, filter, ...) · `transition-all` · `transition-colors` · `transition-opacity` · `transition-transform` · `transition-shadow` · `transition-none`

Duration: `duration-{ms}` (e.g. `duration-300`) · `duration-[200ms]` · `duration-[0.3s]` (seconds → ms)

Delay: `delay-{ms}` · `delay-[200ms]`

Easing: `ease-linear` `ease-in` `ease-out` `ease-in-out` · `ease-[cubic-bezier(0.1,0.7,1,0.1)]`

Example:

```tsx
<View className="bg-primary transition-colors duration-200 ease-out active:bg-primary/80" />
<View className="rotate-12 transition-transform duration-300 ease-in-out" />
```

**Visible motion needs two things:** (1) a state change after initial paint (toggle a class via `useState` etc — utility generation alone is not motion), and (2) a runtime that reads the style keys. The browser's CSS engine reads `transitionDuration` etc. directly off RN-Web's emitted style and interpolates. On native, `<View>` does NOT animate inline styles — drive a Reanimated `useSharedValue` + `withTiming({ duration, easing })` and apply via `useAnimatedStyle`. See `example/app/(tabs)/motion.tsx` for both layers.

**Out of MVP scope:** keyframe-style `animate-spin` / `animate-pulse` / `animate-bounce`. The MVP deliberately does NOT depend on Reanimated for the resolver itself.

### Containers

`@container` `@container-normal` `@container-size` `@container/{name}` — mobile no-op (silently consumed, no warn). Web uses Tailwind's compiled CSS.

`@sm:` `@md:` `@lg:` `@container/sidebar:` modifier prefixes — mobile silently skipped. Web honors via Tailwind.

### Modifiers

4-tier precedence chain. Stack left-to-right.

| Tier | Modifiers |
| :-- | :-- |
| 1 — Platform | `ios:` `android:` `web:` |
| 2 — Color scheme | `dark:` `light:` |
| 3 — State | `active:` `disabled:` `focus:` `pressed:` `hover:` |
| 4 — Responsive | `sm:` `md:` `lg:` `xl:` `2xl:` |

Class only applies when ALL conditions in the chain match. Color scheme reactive on RN via `Appearance.addChangeListener`. Responsive reactive via `Dimensions.addEventListener('change')`.

---

## How It Works

```
┌─────────────────────────────────────────────┐
│              <View className="..." />       │
└────────────────────┬────────────────────────┘
                     │
              ┌──────▼──────┐
              │   Metro     │   ← Babel-pipeline-safe
              │ Transformer │     (Risk #1)
              └──────┬──────┘
                     │  className → __lcssTw()
                     ▼
            ┌─────────────────┐
            │ Platform detect │
            └────┬────────────┘
                 │
         ┌───────┴────────┐
         │                │
  ┌──────▼──────┐  ┌──────▼──────┐
  │   Mobile    │  │     Web     │
  │  Resolver   │  │ passthrough │
  │  + Cache    │  │ to className│
  └──────┬──────┘  └──────┬──────┘
         │                │
         ▼                ▼
   StyleSheet       Tailwind CSS
                    (browser engine)
```

### Single token source

```
        lunar.config.ts (TS, no CSS)
              │
              │  jiti
              │
       flattenTokens()
              │
   ┌──────────┴──────────┐
   │                     │
   ▼                     ▼
Mobile (Metro)        Web (PostCSS)
withLunarCSS          lunarcss plugin
emit __theme__.js     emit @theme {...}
   │                     │
   ▼                     ▼
setTokens()           Tailwind reads tokens
on app boot           at compile time
```

---

## Known Limitations

| Limit | Status | Notes |
| :-- | :-- | :-- |
| Hot-reload of `lunar.config.ts` on native | Metro restart required | PostCSS hot-reload works on web. Mobile content-hash invalidation = follow-up (Risk #12). |
| Container queries on mobile | Silently dropped | Not supported by RN. Web works via Tailwind (Risk #16). |
| OKLCH on mobile | Clamped to nearest sRGB | Wide-gamut values lose chroma. Use sRGB-safe OKLCH or a hex fallback for mobile precision (Risk #2). |
| `animate-*` classes | Skipped with dev warning | Use [`react-native-ease`](https://github.com/marklawlor/react-native-ease) or Reanimated. |
| Tailwind v3 fallback resolver | Deferred | v4 is the primary target. Mixed v3/v4 codebases — open an issue. |
| `color-mix()` on mobile | Not supported | Pre-compute in `lunar.config.ts`. |
| `bg-[url(...)]` on mobile | Skipped | Use `<Image source>`. |
| 3rd-party RN components | Babel transformer skips them | Wrap `className`-aware components in your own factory or rely on your wrapper exposing `style`. |
| Babel-only pipeline (no Metro / no PostCSS) | Not supported | Both real RN and real web pipelines have first-class support. |

---

## Architecture Reference

- [LunarCSS — Product Requirements Document.md](./LunarCSS%20—%20Product%20Requirements%20Document.md) — full PRD
- [LunarCSS — Risk Mitigations.md](./LunarCSS%20—%20Risk%20Mitigations.md) — 18 enumerated risks + mitigations

---

## License

MIT © Eularix Team
