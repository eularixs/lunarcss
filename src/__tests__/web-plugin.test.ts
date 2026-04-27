import { describe, it, expect, afterAll } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import postcss from 'postcss'
import lunarcssPlugin from '../web/plugin.js'

const dirs: string[] = []
function mkRoot(configBody?: string): string {
  const d = mkdtempSync(join(tmpdir(), 'lunarcss-pcss-'))
  dirs.push(d)
  if (configBody) writeFileSync(join(d, 'lunar.config.ts'), configBody)
  return d
}
afterAll(() => {
  for (const d of dirs) {
    try {
      rmSync(d, { recursive: true, force: true })
    } catch {}
  }
})

async function run(
  cssInput: string,
  projectRoot: string,
  fromFile = 'global.css',
): Promise<{ css: string; messages: postcss.Message[] }> {
  const result = await postcss([lunarcssPlugin({ projectRoot })]).process(cssInput, {
    from: join(projectRoot, fromFile),
  })
  return { css: result.css, messages: result.messages }
}

describe('lunarcss PostCSS plugin', () => {
  it('emits @theme block before @import "tailwindcss" with sorted tokens', async () => {
    const root = mkRoot(`export default {
      theme: {
        extend: {
          colors: { primary: '#6366f1', accent: '#f59e0b' },
          spacing: { xs: '4px' },
        },
      },
    }`)
    const { css } = await run(
      `/* LunarCSS */\n@import "tailwindcss";\n@plugin "lunarcss";\n`,
      root,
    )
    expect(css).toContain('@theme')
    // Sorted alphabetically: --color-accent, --color-primary, --spacing-xs
    const themeIdx = css.indexOf('@theme')
    const importIdx = css.indexOf('@import "tailwindcss"')
    expect(themeIdx).toBeLessThan(importIdx)
    expect(css).toMatch(/--color-accent:\s*#f59e0b/)
    expect(css).toMatch(/--color-primary:\s*#6366f1/)
    expect(css).toMatch(/--spacing-xs:\s*4px/)
    const accentPos = css.indexOf('--color-accent')
    const primaryPos = css.indexOf('--color-primary')
    expect(accentPos).toBeLessThan(primaryPos)
  })

  it('prepends @theme when no @import "tailwindcss" present (only @plugin)', async () => {
    const root = mkRoot(`export default { theme: { extend: { colors: { x: '#000' } } } }`)
    const { css } = await run(`@plugin "lunarcss";\nbody { color: red; }\n`, root)
    expect(css).toContain('@theme')
    expect(css.indexOf('@theme')).toBeLessThan(css.indexOf('@plugin'))
  })

  it('skips files without a Tailwind/lunarcss marker', async () => {
    const root = mkRoot(`export default { theme: { extend: { colors: { x: '#000' } } } }`)
    const { css } = await run(`body { color: red; }\n`, root)
    expect(css).not.toContain('@theme')
  })

  it('is idempotent on re-run (marker comment prevents double injection)', async () => {
    const root = mkRoot(`export default { theme: { extend: { colors: { x: '#000' } } } }`)
    const first = await run(`@import "tailwindcss";\n`, root)
    const second = await postcss([lunarcssPlugin({ projectRoot: root })]).process(first.css, {
      from: join(root, 'global.css'),
    })
    const themeOccurrences = second.css.match(/@theme/g)?.length ?? 0
    const markerOccurrences = second.css.match(/lunarcss:emitted/g)?.length ?? 0
    expect(themeOccurrences).toBe(1)
    expect(markerOccurrences).toBe(1)
  })

  it('registers lunar.config.ts as a PostCSS dependency for hot-reload', async () => {
    const root = mkRoot(`export default { theme: { extend: { colors: { x: '#000' } } } }`)
    const { messages } = await run(`@import "tailwindcss";\n`, root)
    const dep = messages.find((m) => m.type === 'dependency' && m.plugin === 'lunarcss')
    expect(dep).toBeTruthy()
    expect((dep as { file: string }).file).toMatch(/lunar\.config\.ts$/)
  })

  it('emits no @theme when config has no tokens', async () => {
    const root = mkRoot(`export default {}`)
    const { css } = await run(`@import "tailwindcss";\n`, root)
    expect(css).not.toContain('@theme')
  })

  it('is a no-op when config file is missing', async () => {
    const root = mkRoot()
    const { css } = await run(`@import "tailwindcss";\n`, root)
    expect(css).not.toContain('@theme')
  })

  it('handles fontSize tuple → emits both --text-* and --text-*--line-height', async () => {
    const root = mkRoot(
      `export default { theme: { extend: { fontSize: { display: ['48px', '52px'] } } } }`,
    )
    const { css } = await run(`@import "tailwindcss";\n`, root)
    expect(css).toMatch(/--text-display:\s*48px/)
    expect(css).toMatch(/--text-display--line-height:\s*52px/)
  })

  it('passthrough option leaves CSS unchanged', async () => {
    const root = mkRoot(`export default { theme: { extend: { colors: { x: '#000' } } } }`)
    const result = await postcss([
      lunarcssPlugin({ projectRoot: root, passthrough: true }),
    ]).process(`@import "tailwindcss";\n`, { from: join(root, 'global.css') })
    expect(result.css).not.toContain('@theme')
  })

  it('preserves user CSS rules around the injected @theme block', async () => {
    const root = mkRoot(`export default { theme: { extend: { colors: { x: '#000' } } } }`)
    const { css } = await run(
      `/* user header */\n@import "tailwindcss";\nbody { margin: 0; }\n`,
      root,
    )
    expect(css).toContain('user header')
    expect(css).toContain('body { margin: 0; }')
    expect(css).toContain('@theme')
  })
})
