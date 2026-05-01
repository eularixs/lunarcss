// Expo + Reanimated. The Reanimated plugin must be the LAST entry in
// `plugins` — it transforms worklets and depends on every other plugin
// having already run. babel-preset-expo is provided by Expo SDK and
// bundles the standard React Native preset chain.
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
