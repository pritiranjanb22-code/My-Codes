const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ttf', 'woff', 'woff2'],
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'svg'],
  },
  watchFolders: [],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);