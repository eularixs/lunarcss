import { ScrollView, Text, View } from 'react-native'

export default function ShowcaseScreen() {
  return (
    <>
    <ScrollView
      className="flex-1 bg-zinc-950 p-3 mt-10"
      contentContainerClassName="px-6 pt-20 pb-12 gap-section"
    >
      {/* Hero */}
      <View className="gap-3">
        <View className="self-start rounded-pill bg-primary/15 px-3 py-1">
          <Text className="text-xs font-semibold text-primary uppercase">
            LunarCSS · v0.1.0
          </Text>
        </View>
        <Text className="text-display font-bold text-white">
          Tailwind v4 for{'\n'}React Native
        </Text>
        <Text className="text-base leading-relaxed text-zinc-400">
          Every token below comes from{' '}
          <Text className="text-primary font-semibold">lunar.config.ts</Text>. The
          same className strings work on iOS, Android, and the browser.
        </Text>
      </View>

      {/* Token Card */}
      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card shadow-lg">
        <Text className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2">
          Branded card
        </Text>
        <Text className="text-2xl font-bold text-white mb-1">
          rounded-card · p-card
        </Text>
        <Text className="text-sm text-zinc-400 mb-4">
          16px radius, 24px padding — both resolved from
          <Text className="text-primary"> theme.extend</Text>.
        </Text>
        <View className="flex-row gap-2">
          <View className="rounded-md bg-primary px-3 py-2">
            <Text className="text-sm font-semibold text-white">Primary</Text>
          </View>
          <View className="rounded-md border border-zinc-700 px-3 py-2">
            <Text className="text-sm font-semibold text-zinc-300">Secondary</Text>
          </View>
        </View>
      </View>

      {/* Color swatches */}
      <View className="gap-3">
        <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Colors — token vs arbitrary vs opacity
        </Text>
        <View className="flex-row gap-3">
          <Swatch className="bg-primary" label="primary" />
          <Swatch className="bg-accent" label="accent" />
          <Swatch className="bg-[#10b981]" label="#10b981" />
          <Swatch className="bg-primary/40" label="primary/40" />
        </View>
      </View>

      {/* Spacing scale */}
      <View className="gap-3">
        <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Spacing scale
        </Text>
        <View className="gap-2">
          <SpacingBar pad="p-2" label="p-2 · 8px" />
          <SpacingBar pad="p-4" label="p-4 · 16px" />
          <SpacingBar pad="p-6" label="p-6 · 24px" />
          <SpacingBar pad="p-card" label="p-card · 24px (token)" />
        </View>
      </View>

      {/* Typography */}
      <View className="gap-3">
        <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Typography scale
        </Text>
        <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card gap-2">
          <Text className="text-xs text-zinc-500">text-xs · zinc-500</Text>
          <Text className="text-sm text-zinc-400">text-sm · zinc-400</Text>
          <Text className="text-base text-zinc-300">text-base · zinc-300</Text>
          <Text className="text-lg font-medium text-zinc-200">text-lg medium</Text>
          <Text className="text-2xl font-bold text-white">text-2xl bold</Text>
          <Text className="text-display font-bold text-primary">
            text-display
          </Text>
        </View>
      </View>

      {/* Borders + radius */}
      <View className="gap-3">
        <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Borders · Radius · Shadow
        </Text>
        <View className="flex-row gap-3 flex-wrap">
          <Demo label="rounded-md">
            <View className="size-16 rounded-md bg-primary" />
          </Demo>
          <Demo label="rounded-xl">
            <View className="size-16 rounded-xl bg-primary" />
          </Demo>
          <Demo label="rounded-card">
            <View className="size-16 rounded-card bg-primary" />
          </Demo>
          <Demo label="rounded-full">
            <View className="size-16 rounded-full bg-primary" />
          </Demo>
          <Demo label="border-2">
            <View className="size-16 rounded-md border-2 border-primary" />
          </Demo>
          <Demo label="shadow-lg">
            <View className="size-16 rounded-md bg-primary shadow-lg" />
          </Demo>
        </View>
      </View>

      {/* Footer hint */}
      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card">
        <Text className="text-sm text-zinc-400 leading-relaxed">
          Tap the{' '}
          <Text className="font-semibold text-primary">Components</Text> tab to
          see modifiers, transforms, and interactive state demos.
        </Text>
      </View>
    </ScrollView>
    </>
  )
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <View className="flex-1 gap-2">
      <View
        className={`h-16 rounded-md border border-zinc-800 ${className}`}
      />
      <Text className="text-xs text-zinc-500">{label}</Text>
    </View>
  )
}

function SpacingBar({ pad, label }: { pad: string; label: string }) {
  return (
    <View className="rounded-md bg-zinc-900 border border-zinc-800">
      <View className={`bg-primary/20 rounded-md ${pad}`}>
        <View className="bg-primary rounded-sm h-3" />
      </View>
      <Text className="text-xs text-zinc-500 px-3 py-2 border-t border-zinc-800">
        {label}
      </Text>
    </View>
  )
}

function Demo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <View className="items-center gap-2">
      {children}
      <Text className="text-xs text-zinc-500">{label}</Text>
    </View>
  )
}
