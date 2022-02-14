const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/demo_client.ts",
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
  },
  plugins: [new HtmlWebpackPlugin()],
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
