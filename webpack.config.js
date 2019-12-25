const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: [
          'raw-loader',
          'glslify-loader'
        ]
      }
    ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname),
    libraryTarget: 'window'
  },
};
