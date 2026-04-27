// Ambient module augmentation: add `className` prop to RN core components.
// Consumers reference via tsconfig "types": ["lunarcss/types"] or
//   /// <reference types="lunarcss/types" />

import 'react-native'

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
  }
  interface ScrollViewProps {
    className?: string
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
  }
  interface SectionListProps<ItemT, SectionT> {
    className?: string
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
}

export {}
