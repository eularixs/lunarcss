// Template body for the generated user-facing lunar.config.ts.
// Kept as a TS string so we can ship it through tsup + maintain syntax.

export const LUNAR_CONFIG_TEMPLATE = `import { defineConfig } from 'lunar-css'

export default defineConfig({
  theme: {
    extend: {
      colors: {
        // primary: 'oklch(0.6 0.2 264)',
        // accent: '#f59e0b',
      },
      spacing: {
        // xs: '4px',
        // card: '24px',
      },
      borderRadius: {
        // card: '14px',
      },
      // fontSize: {
      //   display: ['48px', '52px'],
      // },
    },
  },
})
`
