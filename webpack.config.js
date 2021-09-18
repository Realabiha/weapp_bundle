const path = require('path')
const {resolve} = path
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WxRuntimeChunk = require('./build/plugins/wxRuntimeChunk')
const WxDynamicEntry = require('./build/plugins/wxDynamicEntry')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const ISPROD = process.env.NODE_ENV === 'production'
const SRCDIR = resolve(__dirname, 'src') 
const smp = new SpeedMeasurePlugin()
const plugins = [
  new CopyWebpackPlugin({
    patterns: [
      {
        from: '**/*',
        to: '',
        globOptions: {
          ignore: ['**/*.js', '**/*.scss'],
        },
      },
    ],
  }),
  new WxDynamicEntry(),
  new WxRuntimeChunk(),
]
// 配置TerserPlugin剔除console及debug
const minimizer = [
  new TerserPlugin({
    terserOptions: {
      compress: {
        drop_debugger: true,
        drop_console: true,
      },
    },
  }),
]
const config = {
  context: SRCDIR,
  mode: 'none',
  target: 'node',
  watchOptions: {
    aggregateTimeout: 500,
    ignored: ['**/node_modules', '**/json'],
    poll: 1000,
  },
  entry: { app: './app.js' },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    globalObject: 'wx',
    clean: true,
  },
  resolve: {
    alias: {
      '@': SRCDIR,
    },
    extensions: ['.js', '.json'],
  },
  resolveLoader: {
    modules: ['node_modules', 'build/loaders'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.s(a|c)ss$/,
        include: /src/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].wxss',
              context: resolve('src'),
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  plugins: ISPROD
    ? plugins
    : [new BundleAnalyzerPlugin({ openAnalyzer: false }), ...plugins],
  optimization: {
    // tree shaking
    usedExports: true,
    // runtime code
    runtimeChunk: {
      name: 'runtime',
    },
    // code splitting
    splitChunks: {
      chunks: 'all',
      name: 'common',
      // code cache
      cacheGroups: {
        lottie: {
          name: 'lottie',
          test: /[\\/]lottie-miniprogram[\\/]/,
          priority: 0,
        },
        // animationJson: {
        //   name: 'animationJson',
        //   test: /json/,
        //   priority: 0,
        // },
      },
    },
    moduleIds: ISPROD ? 'deterministic' : 'named',
  },
}

// 生产环境剔除console及debug
ISPROD && (config.optimization.minimizer = minimizer)

module.exports = ISPROD ? config : smp.wrap(config)