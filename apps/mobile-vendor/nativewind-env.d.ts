// Augment React Native core components with className / cssInterop props,
// matching the runtime provided by nativewind@4's jsx-runtime.
// We inline this here (rather than `/// <reference types="nativewind/types" />`)
// because NativeWind 4.2's types.d.ts lives at the package root and isn't
// picked up by tsc's @types resolution.

declare module 'react-native' {
  interface ViewProps {
    className?: string
    cssInterop?: boolean
  }
  interface TextProps {
    className?: string
    cssInterop?: boolean
  }
  interface ImagePropsBase {
    className?: string
    cssInterop?: boolean
  }
  interface ImageBackgroundProps {
    imageClassName?: string
  }
  interface ScrollViewProps {
    contentContainerClassName?: string
    indicatorClassName?: string
  }
  interface FlatListProps<ItemT> {
    columnWrapperClassName?: string
  }
  interface SwitchProps {
    className?: string
    cssInterop?: boolean
  }
  interface TouchableWithoutFeedbackProps {
    className?: string
    cssInterop?: boolean
  }
  interface TextInputProps {
    placeholderClassName?: string
  }
  interface PressableProps {
    className?: string
    cssInterop?: boolean
  }
  interface KeyboardAvoidingViewProps {
    contentContainerClassName?: string
  }
}

// Pressable is a function component — the core type doesn't extend
// ViewProps, so the module-level augmentation above plus its own interface
// gives TypeScript enough to accept className.
export {}
