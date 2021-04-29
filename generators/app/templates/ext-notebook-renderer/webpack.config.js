const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { DefinePlugin } = require('webpack');
const path = require('path');

const outputFilename = 'index.js';
const devServerPort = 8111;

module.exports = (env, argv) => ({
  mode: argv.mode,
  devtool: argv.mode === 'production' ? false : 'inline-source-map',
  entry: './src/client/index.ts',
  output: {
    path: path.join(__dirname, 'out', 'client'),
    filename: outputFilename,
    publicPath: '',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
  },
  module: {
    rules: [
      // Allow importing ts(x) files:
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: 'src/client/tsconfig.json',
          // transpileOnly enables hot-module-replacement
          transpileOnly: true,
          compilerOptions: {
            // Overwrite the noEmit from the client's tsconfig
            noEmit: false,
          },
        },
      },
      // Allow importing CSS modules:
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: true,
            },
          },
        ],
      },
    ],
  },
  devServer: {
    port: devServerPort,
    hot: true,
    // Disable the host check, otherwise the bundle running in VS Code won't be
    // able to connect to the dev server
    disableHostCheck: true,
    writeToDisk: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        tsconfig: 'src/client/tsconfig.json',
      },
    }),
    new DefinePlugin({
      // Path from the output filename to the output directory
      __webpack_relative_entrypoint_to_root__: JSON.stringify(
        path.posix.relative(path.posix.dirname(`/${outputFilename}`), '/'),
      ),
    }),
  ],
});
