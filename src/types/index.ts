// Ambient module augmentation: add `className` prop to RN core components.
// Consumers reference via tsconfig "types": ["@lunar-kit/css/types"] or
//   /// <reference types="@lunar-kit/css/types" />

// CRITICAL: do NOT `import` from 'react-native' at the type level here.
// The emitted d.ts ships in `node_modules/@lunar-kit/css/dist/types/`. If it imports
// from 'react-native', TS resolves that against lunarcss's *own* RN (its
// devDep version), so the augmentation lands on the wrong module instance and
// consumer apps that use a different RN never see `className`.
//
// Side-effect import below is stripped from the emitted d.ts by tsup, but
// keeps tsc happy at *build time* when it needs to resolve the augmentation
// target. The exported marker forces the emitted d.ts to remain a module
// (otherwise `declare module` becomes a script-level declaration that
// REPLACES rather than augments react-native).
import 'react-native'

export type LunarCSSTypesMarker = true

declare module 'react-native' {
  interface ViewProps {
    className?: string
  }
  interface TextProps {
    className?: string
  }
  interface ImageProps {
    className?: string
  }
  interface ImageBackgroundProps {
    className?: string
    imageClassName?: string
  }
  interface ScrollViewProps {
    className?: string
    contentContainerClassName?: string
  }
  interface PressableProps {
    className?: string
  }
  interface TextInputProps {
    className?: string
  }
  interface SwitchProps {
    className?: string
  }
  interface FlatListProps<ItemT> {
    className?: string
    contentContainerClassName?: string
  }
  interface SectionListProps<ItemT, SectionT> {
    className?: string
    contentContainerClassName?: string
  }
  interface TouchableOpacityProps {
    className?: string
  }
  interface TouchableHighlightProps {
    className?: string
  }
  interface TouchableWithoutFeedbackProps {
    className?: string
  }
  interface KeyboardAvoidingViewProps {
    className?: string
  }
  interface SafeAreaViewProps {
    className?: string
  }
}

export {}
