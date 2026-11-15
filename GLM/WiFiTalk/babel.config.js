module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    ['module-resolver', {
      root: ['.'],
      alias: {
        '@': './src',
        '@components': './src/components',
        '@screens': './src/screens',
        '@services': './src/services',
        '@store': './src/store',
        '@utils': './src/utils',
        '@types': './src/types',
        '@hooks': './src/hooks',
        '@constants': './src/constants',
        '@assets': './src/assets',
        '@navigation': './src/navigation',
        '@db': './src/db',
      },
    }],
  ],
};