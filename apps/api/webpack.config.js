const path = require('path');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  externals: {
    bcrypt: 'commonjs bcrypt',
    bcryptjs: 'commonjs bcryptjs',
    postgres: 'commonjs postgres',
    '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },
};
