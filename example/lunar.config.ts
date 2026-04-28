import { defineConfig } from 'lunarcss'

export default defineConfig({
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        accent: '#f59e0b',
        surface: '#0b0b14',
        muted: '#27272a',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        card: '24px',
        section: '48px',
      },
      borderRadius: {
        card: '16px',
        pill: '9999px',
      },
      fontSize: {
        display: ['40px', '44px'],
      },
      width: {
        card: '320px',
      },
    },
  },
})
