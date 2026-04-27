import type { RuntimeContext, Platform, ColorScheme } from './types.js'

let contextProvider: (() => RuntimeContext) | null = null

export function setRuntimeContextProvider(fn: () => RuntimeContext): void {
  contextProvider = fn
}

export function getRuntimeContext(): RuntimeContext {
  if (contextProvider) return contextProvider()
  return {
    platform: 'web',
    colorScheme: 'light',
    width: 1024,
    state: {},
  }
}

export function makeContext(
  partial: Partial<RuntimeContext> & { platform: Platform; colorScheme: ColorScheme; width: number },
): RuntimeContext {
  return {
    state: {},
    ...partial,
  }
}
