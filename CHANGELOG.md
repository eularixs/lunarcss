# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2026-04-27

First public release.

### Added

**Core runtime**
- `resolveClassList()` — full Tailwind v4 class resolver for React Native, with LRU cache (default 1000 entries) and theme-hash-based invalidation
- 4-tier modifier precedence: Platform (`ios:` `android:` `web:`) → ColorScheme (`dark:` `light:`) → State (`active:` `disabled:` `focus:` `hover:` `pressed:`) → Responsive (`sm:` `md:` `lg:` `xl:` `2xl:`)
- `setTokens()` / `clearTokens()` / `getToken()` API for injecting theme tokens at boot
- `invalidateTokens()` with reverse token index for O(1) cache invalidation
- `Appearance.addChangeListener` wiring for reactive dark/light mode
- `Dimensions.addEventListener` wiring for reactive responsive breakpoints

**Utility groups (9 total)**
- **Spacing** — `p-*` `m-*` `gap-*` `inset-*` `top/right/bottom/left-*`; numeric, named token, arbitrary, fraction, negative, `auto`/`full`/`px`
- **Colors** — `bg-*` `text-*` `border-*` `ring-*` `shadow-*` `tint-*` `placeholder-*`; named tokens, CSS keywords, arbitrary hex/OKLCH, opacity modifier (`/50`)
- **Layout** — `flex` `hidden` flex-direction/wrap/grow/shrink, alignment (`items-*` `justify-*` `self-*` `content-*`), position (`absolute` `relative` `static`), `overflow-*` `z-*`
- **Sizing** — `w-*` `h-*` `min-w-*` `max-w-*` `min-h-*` `max-h-*` `size-*`; fractions, `full`/`auto`/`screen`, named tokens
- **Typography** — `text-{xs..9xl}` scale + arbitrary + token; `font-*` weight/family; `leading-*` (multiplier-resolved post-merge); `tracking-*`; alignment, decoration, transform
- **Borders** — `rounded-*` (scale + per-corner + token + arbitrary); `border-*` (width + side + style)
- **Effects** — `opacity-*`; `shadow-*` with RN-compatible `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` + Android `elevation`
- **Transforms** — `translate-*` `rotate-*` `scale-*` `skew-*` `transform-none`; 3D rotate variants; multi-class concat into single `transform` array
- **Containers** — `@container` `@container/{name}` silent no-op on mobile; `@sm:` `@md:` `@lg:` container query modifiers skipped on native

**OKLCH → sRGB conversion** via `culori` for wide-gamut colors on mobile with out-of-gamut dev warning

**Metro integration**
- `withLunarCSS(config)` — wraps Metro config; loads `lunar.config.ts` via jiti, flattens tokens, emits `.lunarcss/__theme__.js` (content-hash delta check)
- `resolveRequest` interceptor routes bare specifier `lunarcss/__theme__` to generated virtual module
- Metro transformer (`lunarcss/metro/transformer`) — AST-based className → `__lcssTw()` call, only for RN intrinsic elements, co-exists with any upstream transformer via `LUNARCSS_UPSTREAM_TRANSFORMER` env
- `__theme__.ts` stub for non-Metro environments (tests, web SSR)

**PostCSS web plugin** (`lunarcss/web/plugin`)
- Reads `lunar.config.ts` via jiti (no module cache) and emits `@theme { ... }` block before `@import "tailwindcss"`
- `shouldRunOn()` heuristic limits injection to entry CSS files
- Idempotent via `/* lunarcss:emitted */` marker comment
- Registers `lunar.config.ts` as PostCSS `dependency` for Next.js / Vite / Webpack hot-reload

**Token system** (`lunar.config.ts`)
- `defineConfig()` with full TypeScript types
- `flattenTokens()` shared between Metro and PostCSS paths — namespace → CSS prefix map for `colors`, `spacing`, `fontSize` (tuple), `fontWeight`, `fontFamily`, `borderRadius`, `width`, `height`, `min-w`, `max-w`, `min-h`, `max-h`, `letterSpacing`, `lineHeight`
- Flat `tokens` escape hatch overrides namespaced values

**CLI** (`npx lunarcss init`)
- Auto-detects Expo, Next.js, RN Bare from `package.json`
- Generates `lunar.config.ts`, `metro.config.js` (create or AST-merge), `app/globals.css`, `.gitignore`, `tsconfig.json` per platform
- Idempotent re-run with `[+]`/`[~]`/`[=]`/`[s]` status reporting
- AST merge for existing `metro.config.js` — injects import + wraps `module.exports` without destroying user code
- `--dry-run` preview flag

**TypeScript types**
- `LunarConfig` / `ThemeExtend` / `ThemeTokens` interfaces
- React Native component augmentations: `className` prop on `View`, `Text`, `TextInput`, `Image`, `ScrollView`, `TouchableOpacity`, `Pressable`, `FlatList`, `SectionList`, `Modal`

**Test suite** — 240 tests across all modules (vitest)

[0.1.0]: https://github.com/eularix/lunarcss/releases/tag/v0.1.0
