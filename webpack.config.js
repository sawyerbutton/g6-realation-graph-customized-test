const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          compilerOptions: {
            declaration: false,
          },
        }
      }
    ]
  },
  resolve: {
    extensions: ['*', '.ts', '.tsx', '.js', '.jsx'],
  },
  output: {
    // library: 'Graphin',
    // libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    // publicPath: './',
    filename: 'graphin.min.js',
  },
  plugins: [
    // new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      title: 'asdasdads',
      filename: 'index.html',
      template: './public/index.html'
    })
  ]
}