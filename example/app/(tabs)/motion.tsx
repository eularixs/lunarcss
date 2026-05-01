// Motion showcase. Two layers:
//   1. Class-driven web transitions — same component, same className stub +
//      one toggling utility. RN-Web compiles transition* keys to real CSS;
//      browser interpolates the changing property. Visible only on web.
//   2. Reanimated driver — drives the same visual change via `withTiming`,
//      reading duration/easing intent from lunarcss tokens (or hardcoded).
//      Visible on iOS / Android / web.
//
// Why two layers? Lunar utilities declare intent as RN style keys
// (transitionDuration: "300ms" etc). Native View does not animate styles —
// only Reanimated/Animated drive interpolation. Web's CSS engine animates
// styles itself via the same keys. Same intent, two execution paths.

import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

export default function MotionScreen() {
  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerClassName="px-6 pt-20 pb-12 gap-section"
    >
      <View className="gap-3">
        <Text className="text-display font-bold text-white">Motion</Text>
        <Text className="text-base leading-relaxed text-zinc-400">
          Tap each card. The same lunar transition utilities declare intent on
          both platforms; web animates via CSS, native animates via Reanimated.
        </Text>
      </View>

      <Section
        eyebrow="Static transforms"
        title="translate · rotate · scale · skew"
        description="Each class adds one transform op; multiple stack in className order."
      >
        <View className="flex-row gap-4 flex-wrap">
          <Demo label="rotate-12">
            <View className="size-16 rounded-md bg-primary rotate-12" />
          </Demo>
          <Demo label="-rotate-45">
            <View className="size-16 rounded-md bg-primary -rotate-45" />
          </Demo>
          <Demo label="scale-75">
            <View className="size-16 rounded-md bg-primary scale-75" />
          </Demo>
          <Demo label="skew-x-12">
            <View className="size-16 rounded-md bg-primary skew-x-12" />
          </Demo>
          <Demo label="translate-y-2 + rotate-12 + scale-110">
            <View className="size-16 rounded-md bg-accent translate-y-2 rotate-12 scale-110" />
          </Demo>
        </View>
      </Section>

      <Section
        eyebrow="Class-driven · web only"
        title="Tap to toggle (visible on web)"
        description="Native View does not animate inline styles, so these toggle instantly on iOS/Android. RN-Web compiles transition* keys to real CSS — see browser."
      >
        <View className="gap-3">
          <ClassToggleColors />
          <ClassToggleOpacity />
          <ClassToggleScale />
        </View>
      </Section>

      <Section
        eyebrow="Reanimated · all platforms"
        title="Tap to animate (iOS, Android, web)"
        description="Driven by withTiming({ duration, easing }) — the duration matches a lunar `duration-300` utility for visual parity."
      >
        <View className="gap-3">
          <ReanimatedScale />
          <ReanimatedRotate />
          <ReanimatedFade />
          <ReanimatedCombo />
        </View>
      </Section>

      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card gap-2">
        <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
          Note
        </Text>
        <Text className="text-sm text-zinc-400 leading-relaxed">
          Utility generation alone does not create motion. Motion requires (a) a
          state change after initial paint and (b) a runtime that reads style
          keys — CSS on web, Reanimated/Animated on native. Lunar emits the
          intent; the runtime executes it.
        </Text>
      </View>
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
        <Text className="text-sm text-zinc-400 leading-relaxed">{description}</Text>
      </View>
      {children}
    </View>
  )
}

function Demo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="items-center gap-2 w-28">
      <View className="size-20 items-center justify-center">{children}</View>
      <Text className="text-xs text-zinc-500 text-center">{label}</Text>
    </View>
  )
}

// --- Class-driven toggles (web visible) -------------------------------------
//
// Same outer wrapper persists across re-renders. Only the trailing utility
// changes — RN-Web emits a stable transition rule and swaps just the changed
// property class. Browser interpolates. Native sees no motion (inline styles
// don't animate).

function ClassToggleColors() {
  const [on, setOn] = useState(false)
  return (
    <Pressable onPress={() => setOn((v) => !v)}>
      <View
        className={[
          'rounded-pill px-5 py-3 transition-colors duration-300 ease-in-out',
          on ? 'bg-accent' : 'bg-primary',
        ].join(' ')}
      >
        <Text className="text-center text-white font-semibold">
          transition-colors · {on ? 'accent' : 'primary'}
        </Text>
      </View>
    </Pressable>
  )
}

function ClassToggleOpacity() {
  const [on, setOn] = useState(true)
  return (
    <Pressable onPress={() => setOn((v) => !v)}>
      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card items-center gap-3">
        <Text className="text-xs text-zinc-500">tap → toggle opacity (web)</Text>
        <View
          className={[
            'size-12 rounded-md bg-accent transition-opacity duration-300 ease-out',
            on ? 'opacity-100' : 'opacity-25',
          ].join(' ')}
        />
      </View>
    </Pressable>
  )
}

function ClassToggleScale() {
  const [big, setBig] = useState(false)
  return (
    <Pressable onPress={() => setBig((v) => !v)}>
      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card items-center gap-3">
        <Text className="text-xs text-zinc-500">tap → toggle scale (web)</Text>
        <View
          className={[
            'size-12 rounded-md bg-primary transition-transform duration-300 ease-in-out',
            big ? 'scale-150' : 'scale-100',
          ].join(' ')}
        />
      </View>
    </Pressable>
  )
}

// --- Reanimated drivers (visible on every platform) -------------------------
//
// Use Reanimated to interpolate transform/opacity over the same duration the
// lunar `duration-300` class would have declared. Visible on iOS, Android,
// AND web — Reanimated runs on web too.

const TIMING = { duration: 300, easing: Easing.inOut(Easing.ease) }

function ReanimatedScale() {
  const [big, setBig] = useState(false)
  const v = useSharedValue(1)
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }))
  return (
    <Pressable
      onPress={() => {
        const target = big ? 1 : 1.5
        v.value = withTiming(target, TIMING)
        setBig((b) => !b)
      }}
    >
      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card items-center gap-3">
        <Text className="text-xs text-zinc-500">tap → withTiming scale 1 ↔ 1.5</Text>
        <Animated.View
          className="size-12 rounded-md bg-primary"
          style={aStyle}
        />
      </View>
    </Pressable>
  )
}

function ReanimatedRotate() {
  const [n, setN] = useState(0)
  const deg = useSharedValue(0)
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${deg.value}deg` }],
  }))
  return (
    <Pressable
      onPress={() => {
        const next = n + 90
        deg.value = withTiming(next, TIMING)
        setN(next)
      }}
    >
      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card items-center gap-3">
        <Text className="text-xs text-zinc-500">tap → rotate +90°</Text>
        <Animated.View
          className="size-12 rounded-md bg-accent"
          style={aStyle}
        />
      </View>
    </Pressable>
  )
}

function ReanimatedFade() {
  const [on, setOn] = useState(true)
  const op = useSharedValue(1)
  const aStyle = useAnimatedStyle(() => ({ opacity: op.value }))
  return (
    <Pressable
      onPress={() => {
        op.value = withTiming(on ? 0.25 : 1, TIMING)
        setOn((v) => !v)
      }}
    >
      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card items-center gap-3">
        <Text className="text-xs text-zinc-500">tap → opacity 1 ↔ 0.25</Text>
        <Animated.View
          className="size-12 rounded-md bg-primary"
          style={aStyle}
        />
      </View>
    </Pressable>
  )
}

function ReanimatedCombo() {
  const [on, setOn] = useState(false)
  const t = useSharedValue(0)
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: t.value * 16 },
      { scale: 1 + t.value * 0.25 },
    ],
    opacity: 1 - t.value * 0.5,
  }))
  return (
    <Pressable
      onPress={() => {
        t.value = withTiming(on ? 0 : 1, TIMING)
        setOn((v) => !v)
      }}
    >
      <View className="rounded-card border border-zinc-800 bg-zinc-900 p-card items-center gap-3">
        <Text className="text-xs text-zinc-500">tap → translateY + scale + opacity</Text>
        <Animated.View
          className="size-16 rounded-md bg-accent"
          style={aStyle}
        />
      </View>
    </Pressable>
  )
}
