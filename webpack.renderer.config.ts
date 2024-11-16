import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import path from 'path';

rules.push({
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
});

export const rendererConfig: Configuration = {
  module: {
    rules: [
      ...rules,
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /(node_modules|\.webpack)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
            plugins: [],
          },
        },
      },
    ],
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  target: 'web',
  devtool: 'source-map',
  mode: 'development',
  devServer: {
    hot: true,
    liveReload: true,
  },
};
