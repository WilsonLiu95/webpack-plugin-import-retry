const importRetry = require("../../src/index.js");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const baseConfig = require("../base.webpack.config");

const rel = paths => path.resolve(__dirname, ...paths);

module.exports = Object.assign({}, baseConfig, {
  entry: rel`./entry.js`,
  // devtool: "sourcemap",
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              modules: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new importRetry(),
    new HtmlWebpackPlugin({
      filename: "index.html"
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
      chunkFilename: "[id].[contenthash].css"
    })
  ]
});
