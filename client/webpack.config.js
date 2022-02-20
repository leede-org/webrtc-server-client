const path = require("path");
const package = require("./package.json");

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: {
    "leede-webrtc-client": "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `[name]-${package.version}.js`,
    libraryTarget: "umd",
    library: "leede",
    umdNamedDefine: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
