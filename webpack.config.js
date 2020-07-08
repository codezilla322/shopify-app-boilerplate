const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './server.js',
  target: 'node',
  externals: nodeExternals(),
  mode: 'production',
  output: {
    filename: 'server.bundle.js',
    path: __dirname,
  },
  resolve: {
    alias: {
      '@libs' : path.resolve(__dirname, 'app/libs/'),
      '@models' : path.resolve(__dirname, 'app/models/'),
      '@routes': path.resolve(__dirname, 'app/routes/'),
    }
  }
};