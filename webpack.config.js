const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');





module.exports = (env) => {
  console.log(`dirname:`, __dirname);
  console.log(`env:`, env);
  
  const MAIN_ENTRY_FILE = path.resolve(__dirname, 'apps/apigateway/src/main.ts');

  const PUSH_ALERTS_WORKER_ENTRY_FILE = path.resolve(__dirname, 'libs/carry-app-services/src/workers/push-new-listings-alerts.worker.ts');
  const OUTPUT_PATH = path.resolve(__dirname, 'build');
  const TSCONFIG_PATH = path.resolve(__dirname, 'tsconfig.json');
  const OUTPUT_FILE = `main.app.js`;
  
  console.log({ MAIN_ENTRY_FILE, OUTPUT_PATH, OUTPUT_FILE, TSCONFIG_PATH });



  const usePlugins = [
    new NodemonPlugin(),
  ];
  
  if (env.addLocalEnv) {
    console.log(`including static resources...`);
    usePlugins.push(
      new CopyPlugin({
        patterns: [
          { from: './.env', to: '' },
          { from: './assets', to: 'assets' },
        ],
      })
    );
  }

  return {
    target: 'node',
    mode: 'none',
    externals: [nodeExternals()],
    // entry: ENTRY_FILE,

    entry: {
      main: {
        import: MAIN_ENTRY_FILE,
        // dependOn: 'shared'
      },

      'push-alerts-worker': {
        import: PUSH_ALERTS_WORKER_ENTRY_FILE,
        // dependOn: 'shared'
      }
    },

    devtool: "inline-source-map",
    output: {
      path: OUTPUT_PATH,
      filename: '[name].bundle.js',
      libraryTarget: 'commonjs2'
    },
  
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: TSCONFIG_PATH
        })
      ]
    },

    plugins: usePlugins
  };
};