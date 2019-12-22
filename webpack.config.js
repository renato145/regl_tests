const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool: 'eval-source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname),
    libraryTarget: 'window'
  },
};
