import { setTokens, type TokenMap } from './tokens.js'
import { invalidateTokens } from './cache.js'
import { themeEmitter } from './emitter.js'

export function updateTheme(tokens: TokenMap): void {
  setTokens(tokens)
  invalidateTokens(Object.keys(tokens))
  themeEmitter.emit()
}

export function subscribeTheme(fn: () => void): () => void {
  return themeEmitter.on(fn)
}
