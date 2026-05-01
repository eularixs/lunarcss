import Link from 'next/link'
import { appName, gitConfig, npmUrl, changelogUrl } from '@/lib/shared'
import { Particles } from '@/components/particles'

const REPO_URL = `https://github.com/${gitConfig.user}/${gitConfig.repo}`

const COMPARISON: Array<{ problem: string; solution: string }> = [
  { problem: 'NativeWind setup is complex', solution: 'lunarcss init — single command' },
  { problem: 'TWRNC is locked to Tailwind v3', solution: 'Native Tailwind v4 support' },
  { problem: 'TWRNC has no web support', solution: 'Same className works on RN + Web' },
  { problem: 'TWRNC resolves at runtime every render', solution: 'Build-time extraction + LRU cache' },
  { problem: 'Reanimated conflict via JSX transform', solution: 'Metro-layer transform — zero clash' },
  { problem: 'Static themes only', solution: 'Reactive CSS variables via lunar.config.ts' },
  { problem: 'Manual rewrite per Tailwind update', solution: 'Modular utility groups' },
]

const FEATURES: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: '⚡',
    title: 'lunarcss init',
    body: 'One command auto-detects Expo, Next.js, or RN bare and wires every config file. Idempotent re-runs never overwrite your edits.',
  },
  {
    icon: '🎨',
    title: 'lunar.config.ts',
    body: 'A single TypeScript file is the source of truth for design tokens — read by Metro on native and PostCSS on web.',
  },
  {
    icon: '🔧',
    title: 'Metro-layer transform',
    body: 'className transformation runs in Metro after Babel — no JSX-pipeline conflict with Reanimated or other Babel plugins.',
  },
  {
    icon: '🚀',
    title: 'Tailwind v4 native',
    body: 'Built on the v4 @theme model, oklch colors, and v4 modifiers. Not a v3 backport.',
  },
  {
    icon: '🌐',
    title: 'Cross-platform',
    body: 'The same className string works on iOS, Android, and the browser. Mobile resolves to StyleSheet, web passes through to Tailwind.',
  },
  {
    icon: '💾',
    title: 'LRU cache',
    body: 'Resolved styles are cached with a theme-hash key. O(1) invalidation when a token changes via the reverse token index.',
  },
]

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card/80 px-3 py-1 text-xs font-medium backdrop-blur">
      <span className="text-fd-muted-foreground">{label}</span>
      <span className={color}>{value}</span>
    </span>
  )
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-fd-border bg-fd-card p-6 transition hover:border-fd-foreground/20 hover:shadow-lg">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/0 to-violet-500/10 opacity-0 transition group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-3 text-2xl">{icon}</div>
        <h3 className="mb-2 text-base font-semibold text-fd-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-fd-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

const ARCHITECTURE_DIAGRAM = `         lunar.config.ts (TypeScript, no CSS)
                       │
                       │  jiti
                       ▼
                flattenTokens()
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
      Mobile (Metro)         Web (PostCSS)
      withLunarCSS           lunarcss plugin
      emit __theme__.js      emit @theme {…}
            │                     │
            ▼                     ▼
       setTokens()           Tailwind reads
       on app boot           tokens at compile`

const USAGE_EXAMPLE = `import { View, Text } from 'react-native'

export default function Screen() {
  return (
    <View className="flex-1 items-center justify-center bg-zinc-900">
      <Text className="text-2xl font-bold text-white">Hello LunarCSS</Text>
    </View>
  )
}`

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-fd-border px-6 py-24 sm:py-32">
        {/* gradient orb */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-blue-500/20 blur-3xl"
        />
        {/* particle layer */}
        <div aria-hidden className="pointer-events-auto absolute inset-0 -z-10">
          <Particles density={70} linkDistance={130} speed={0.2} />
        </div>
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge label="tests" value="306 passing" color="text-green-500" />
            <Badge label="core" value="11.17 kb gzip" color="text-blue-500" />
            <Badge label="license" value="MIT" color="text-fd-foreground" />
          </div>
          <h1 className="bg-gradient-to-br from-fd-foreground to-fd-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
            Tailwind v4 for
            <br />
            React Native and Web
          </h1>
          <p className="max-w-2xl text-base text-fd-muted-foreground sm:text-lg">
            Zero-config. One config file. One source of truth.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/getting-started/introduction"
              className="rounded-md bg-fd-primary px-6 py-2.5 text-sm font-semibold text-fd-primary-foreground shadow-lg shadow-fd-primary/20 transition hover:scale-[1.02] hover:opacity-90"
            >
              Get Started →
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-fd-border bg-fd-card/80 px-6 py-2.5 text-sm font-semibold text-fd-foreground backdrop-blur transition hover:bg-fd-accent"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-b border-fd-border px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-fd-muted-foreground">
              The pitch
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-fd-foreground">
              Why {appName}?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-fd-muted-foreground">
              Existing solutions force a tradeoff between platforms, performance, or stability.
              {' '}{appName} doesn’t.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-fd-border shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-fd-muted/40">
                <tr>
                  <th className="px-5 py-3 font-semibold text-fd-foreground">Problem</th>
                  <th className="px-5 py-3 font-semibold text-fd-foreground">{appName}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr
                    key={row.problem}
                    className="border-t border-fd-border transition hover:bg-fd-muted/20"
                  >
                    <td className="px-5 py-4 text-fd-muted-foreground">{row.problem}</td>
                    <td className="px-5 py-4 font-medium text-fd-foreground">{row.solution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-b border-fd-border px-6 py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-indigo-500/5 to-transparent"
        />
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-fd-muted-foreground">
              Architecture
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-fd-foreground">How it works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-fd-muted-foreground">
              One <code className="rounded bg-fd-muted px-1.5 py-0.5 text-sm">lunar.config.ts</code> drives both
              Metro on native and PostCSS on web. No CSS parsing on mobile. No duplicate token files.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-6 text-xs leading-relaxed text-fd-muted-foreground shadow-sm">
            <code>{ARCHITECTURE_DIAGRAM}</code>
          </pre>
        </div>
      </section>

      {/* Feature cards */}
      <section className="border-b border-fd-border px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-fd-muted-foreground">
              Highlights
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-fd-foreground">What you get</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                body={feature.body}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Quick install */}
      <section className="border-b border-fd-border px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-fd-muted-foreground">
              Quick install
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-fd-foreground">
              Two commands. Then write className.
            </h2>
          </div>
          <pre className="mb-3 overflow-x-auto rounded-lg border border-fd-border bg-fd-card p-4 text-sm">
            <code className="text-fd-foreground">
              <span className="text-fd-muted-foreground">$</span> pnpm add lunarcss
            </code>
          </pre>
          <pre className="mb-6 overflow-x-auto rounded-lg border border-fd-border bg-fd-card p-4 text-sm">
            <code className="text-fd-foreground">
              <span className="text-fd-muted-foreground">$</span> npx lunarcss init
            </code>
          </pre>
          <pre className="overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-6 text-sm leading-relaxed shadow-sm">
            <code className="text-fd-foreground">{USAGE_EXAMPLE}</code>
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-fd-muted-foreground sm:flex-row">
          <span>MIT © Eularix Team 2026</span>
          <nav className="flex flex-wrap items-center gap-5">
            <Link href="/docs" className="transition hover:text-fd-foreground">
              Docs
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-fd-foreground"
            >
              GitHub
            </a>
            <a
              href={changelogUrl}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-fd-foreground"
            >
              Changelog
            </a>
            <a
              href={npmUrl}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-fd-foreground"
            >
              npm
            </a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
