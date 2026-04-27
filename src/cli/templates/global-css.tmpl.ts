// Default `app/globals.css` body when none exists in the user's Next.js
// project. Tailwind v4 + LunarCSS plugin.

export const GLOBAL_CSS_DEFAULT = `/* LunarCSS */
@import "tailwindcss";
@plugin "lunarcss";
`

export const LUNARCSS_BLOCK_HEADER = '/* LunarCSS */'
export const LUNARCSS_BLOCK_BODY = `${LUNARCSS_BLOCK_HEADER}
@import "tailwindcss";
@plugin "lunarcss";
`
