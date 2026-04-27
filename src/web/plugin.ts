// Tailwind CSS plugin entry. Mirrors LunarCSS @theme tokens into the Tailwind
// build pipeline so web and native share the same design tokens.
// Real implementation pending; this stub returns a no-op plugin descriptor.

export interface LunarTailwindPluginOptions {
  themeFile?: string
}

export default function lunarTailwindPlugin(_opts: LunarTailwindPluginOptions = {}) {
  return {
    handler: () => {},
    config: {},
  }
}
