// Default metro.config.js generated when none exists in the user's Expo
// project. Wraps Expo's default Metro config with `withLunarCSS`.

export const METRO_CONFIG_EXPO_DEFAULT = `// LunarCSS-managed Metro config. Edit freely; \`lunarcss init\` will not
// overwrite this file once it exists.
const { getDefaultConfig } = require('expo/metro-config')
const { withLunarCSS } = require('@lunar-kit/css/metro')

const config = getDefaultConfig(__dirname)

module.exports = withLunarCSS(config)
`
