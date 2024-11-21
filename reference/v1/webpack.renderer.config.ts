import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { plugins } from './webpack.renderer.plugins';

rules.push({
  test: /\.css$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: {
          auto: true,
          localIdentName: '[name]__[local]--[hash:base64:5]',
        },
      },
    },
  ],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: plugins.plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    ...plugins.resolve,
  },
  devServer: {
    hot: true,
    client: {
      webSocketURL: {
        hostname: '0.0.0.0',
        pathname: '/ws',
        port: 3001,
        protocol: 'ws',
      },
      overlay: true,
    },
  },
  // Enable source maps and set mode
  devtool: 'source-map',
  mode: 'development',
};
