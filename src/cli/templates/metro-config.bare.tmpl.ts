// Default metro.config.js generated when none exists in a bare React Native
// project. Uses @react-native/metro-config (CLI 0.73+) and chains LunarCSS.

export const METRO_CONFIG_BARE_DEFAULT = `// LunarCSS-managed Metro config. Edit freely; \`lunarcss init\` will not
// overwrite this file once it exists.
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { withLunarCSS } = require('lunarcss/metro')

const defaultConfig = getDefaultConfig(__dirname)

module.exports = withLunarCSS(mergeConfig(defaultConfig, {}))
`
