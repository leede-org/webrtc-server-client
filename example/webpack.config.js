const path = require("path");
const { EnvironmentPlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HTMLInlineCSSWebpackPlugin =
  require("html-inline-css-webpack-plugin").default;

module.exports = {
  mode: process.env.NODE_ENV || "development",
  entry: "./src/demo_client.ts",
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
  },
  plugins: [
    new EnvironmentPlugin({
      NODE_ENV: "development",
      SERVER_URL: "ws://localhost:8000",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
    new HtmlWebpackPlugin(),
    new HTMLInlineCSSWebpackPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "demo-client-[hash].js",
    path: path.resolve(__dirname, "dist", "client"),
    clean: true,
  },
};
