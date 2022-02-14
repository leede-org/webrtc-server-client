const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { EnvironmentPlugin } = require("webpack");

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
    new HtmlWebpackPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "demo-client.js",
    path: path.resolve(__dirname, "dist", "client"),
    clean: true,
  },
};
