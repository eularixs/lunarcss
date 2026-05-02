import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

export default function ComponentsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerClassName="px-6 pt-20 pb-12 gap-section"
    >
      <View className="gap-3">
        <Text className="text-display font-bold text-white">Components</Text>
        <Text className="text-base leading-relaxed text-zinc-400">
          Modifiers, transforms, and reactive state — all driven by className.
        </Text>
      </View>

      {/* Counter — state modifier demo */}
      <Section
        eyebrow="State modifier"
        title="active: + Pressable"
        description="active:scale-95 + active:bg-primary/80 — fires on press."
      >
        <Counter />
      </Section>

      {/* Platform modifiers */}
      <Section
        eyebrow="Platform modifier"
        title="ios: · android: · web:"
        description="Class only applied on the matching platform."
      >
        <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card gap-3">
          <Text className="text-sm text-zinc-400">
            <Text className="text-primary font-semibold">ios:font-semibold</Text>{' '}
            <Text>·</Text>{' '}
            <Text className="text-primary font-semibold">android:font-normal</Text>
          </Text>
          <Text className="text-lg ios:font-bold android:font-light text-white">
            This text adapts per platform
          </Text>
        </View>
      </Section>

      {/* Color scheme modifier */}
      <Section
        eyebrow="Dark/light modifier"
        title="dark: prefix"
        description="Reactive — flips with system appearance via Appearance.addChangeListener."
      >
        <View className="rounded-card border border-zinc-800 bg-white dark:bg-zinc-900 p-card">
          <Text className="text-zinc-900 dark:text-white text-lg font-semibold">
            Adaptive surface
          </Text>
          <Text className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
            bg-white dark:bg-zinc-900 + text-zinc-900 dark:text-white
          </Text>
        </View>
      </Section>

      {/* Transforms */}
      <Section
        eyebrow="Transforms"
        title="Multi-class concat"
        description="translate-y · rotate · scale stack into a single transform array."
      >
        <View className="flex-row gap-4 flex-wrap">
          <TransformDemo label="rotate-12">
            <View className="size-16 rounded-md bg-primary rotate-12" />
          </TransformDemo>
          <TransformDemo label="scale-90">
            <View className="size-16 rounded-md bg-primary scale-90" />
          </TransformDemo>
          <TransformDemo label="-rotate-12 + scale-110">
            <View className="size-16 rounded-md bg-primary -rotate-12 scale-110" />
          </TransformDemo>
          <TransformDemo label="rotate-45 + translate-y-2">
            <View className="size-16 rounded-md bg-primary rotate-45 translate-y-2" />
          </TransformDemo>
        </View>
      </Section>

      {/* Stacked modifiers */}
      <Section
        eyebrow="Modifier stacking"
        title="dark:active:*"
        description="All conditions must match. Press the buttons below."
      >
        <View className="flex-row gap-3">
          <Pressable className="flex-1 rounded-pill bg-primary px-5 py-3 active:scale-95 active:bg-primary/80">
            <Text className="text-center text-white font-semibold">
              Press me
            </Text>
          </Pressable>
          <Pressable className="flex-1 rounded-pill border-2 border-primary px-5 py-3 active:scale-95 active:bg-primary/15">
            <Text className="text-center text-primary font-semibold">
              Outline
            </Text>
          </Pressable>
        </View>
      </Section>

      {/* Opacity */}
      <Section
        eyebrow="Opacity"
        title="Continuous scale"
        description="opacity-{0..100} or arbitrary opacity-[0.42]."
      >
        <View className="flex-row gap-2">
          {[100, 75, 50, 25, 10].map((o) => (
            <View key={o} className="flex-1 items-center gap-2">
              <View
                className={`size-12 rounded-md bg-primary opacity-${o}`}
              />
              <Text className="text-xs text-zinc-500">opacity-{o}</Text>
            </View>
          ))}
        </View>
      </Section>
    </ScrollView>
  )
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </Text>
        <Text className="text-xl font-bold text-white">{title}</Text>
        <Text className="text-sm text-zinc-400 leading-relaxed">
          {description}
        </Text>
      </View>
      {children}
    </View>
  )
}

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card items-center gap-4">
      <Text className="text-6xl font-bold text-primary">{count}</Text>
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => setCount((c) => Math.max(0, c - 1))}
          className="size-12 rounded-full bg-zinc-800 items-center justify-center active:scale-95 active:bg-zinc-700"
        >
          <Text className="text-2xl text-white">−</Text>
        </Pressable>
        <Pressable
          onPress={() => setCount((c) => c + 1)}
          className="size-12 rounded-full bg-primary items-center justify-center active:scale-95 active:bg-primary/80"
        >
          <Text className="text-2xl text-white">+</Text>
        </Pressable>
      </View>
    </View>
  )
}

function TransformDemo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <View className="items-center gap-2 w-24">
      <View className="size-20 items-center justify-center">{children}</View>
      <Text className="text-xs text-zinc-500 text-center">{label}</Text>
    </View>
  )
}
