const path = require('path');

const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');

module.exports = {
  entry: ['./src/app.ts'],
  output: {
    publicPath: '/assets/',
    filename: 'bundle.js',
  },
  optimization: {
    minimizer: [new TerserPlugin({})],
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      // fix double imports that break build from deps that use lit render/html tag
      'lit-element': path.resolve('./node_modules/lit-element'),
      'lit-html': path.resolve('./node_modules/lit-html'),
      '@vaadin': path.resolve('./node_modules/@vaadin'),
      '@turf': path.resolve('./node_modules/@turf'),
      protobufjs: path.resolve('./node_modules/protobufjs'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      },
    ],
  },
  plugins: [
    new DuplicatePackageCheckerPlugin(),
    new CopyPlugin([
      {
        from: 'src/styles/*.css',
      },
      {
        from: 'src/i18n/*.json',
      },
      {
        from: 'src/img',
        to: 'src/img',
        toType: 'dir',
        cache: true,
      },
      {
        from: 'node_modules/@webcomponents/webcomponentsjs/**/*.js',
      },
      {
        from: 'src/js/**/*.js',
      },
    ]),
    new LiveReloadPlugin(
      Object.assign({}, {
        protocol: 'http',
        hostname: 'localhost',
        port: 35729,
      })
    ),
  ],
};
