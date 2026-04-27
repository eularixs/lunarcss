// CSS-named color keywords supported by both web and RN.
// Subset of CSS Color L3 — extend as needed.
export const NAMED_COLORS: Readonly<Record<string, string>> = {
  transparent: 'transparent',
  current: 'currentColor', // RN ignores; only meaningful on web
  inherit: 'inherit',
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
}
