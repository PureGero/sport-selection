const HtmlWebpackPlugin = require('html-webpack-plugin');
const jsToScss = require("./utils/jsToScss.js");
const configCustom = require('./config.js');
const configDefault = require('./config.default.js');

const config = Object.assign(configDefault, configCustom);

config.commitHash = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

module.exports = {
  mode: 'development',
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index_bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      templateParameters: config,
    })
  ],
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          {
            loader: "sass-loader",
            options: {
              additionalData: jsToScss(config)
            }
          }
        ]
      }
    ]
  }
};