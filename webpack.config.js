const HtmlWebpackPlugin = require('html-webpack-plugin');
const jsToScss = require("./utils/jsToScss.js");
const fs = require('fs');

const commitHash = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

const firebaseJson = {
  hosting: []
};

module.exports = fs.readdirSync('.').filter(f => f.startsWith('config.') && f.endsWith('.js')).map(f => {
  const name = f.substring(f.indexOf('.') + 1, f.lastIndexOf('.'));

  const config = {
    name,
    commitHash,
    ...require(`./${f}`)
  }

  firebaseJson.hosting.push({
    target: name,
    public: 'dist/' + name
  });

  console.log(`Building ${name}`);

  return {
    mode: 'production',
    entry: __dirname + '/src/index.js',
    output: {
      path: __dirname + '/dist/' + name,
      filename: 'index_bundle.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        templateParameters: config,
      }),
      new HtmlWebpackPlugin({
        filename: '404.html',
        template: 'src/404.html',
        templateParameters: config,
      }),
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
  }
});

fs.writeFileSync(__dirname + '/firebase.json', JSON.stringify(firebaseJson, null, 2));