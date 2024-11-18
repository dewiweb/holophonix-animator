import type { Configuration } from 'webpack';

export const plugins = {
  resolve: {
    fallback: {
      path: require.resolve('path-browserify'),
      fs: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      os: require.resolve('os-browserify/browser'),
      buffer: require.resolve('buffer/'),
    },
  },
} as Configuration;
