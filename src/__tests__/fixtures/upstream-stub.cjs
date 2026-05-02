// Minimal stand-in for @react-native/metro-babel-transformer used in
// dist-transformer.integration.test.ts. Returns the input echoed back.
module.exports = {
  transform({ src, filename }) {
    return { ast: null, src, filename }
  },
}
