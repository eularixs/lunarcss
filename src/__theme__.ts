// Default empty theme. Metro's resolver swaps this module for a generated
// file containing the user's `lunar.config.ts` tokens when `withLunarCSS()`
// is active. In test environments and bare Node usage, the import resolves
// here and tokens stay empty — the runtime falls back to built-in defaults.

export const THEME_TOKENS: Readonly<Record<string, string>> = Object.freeze({})
