// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const { withLunarCSS } = require('@lunar-kit/css/metro')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

module.exports = withLunarCSS(config)
