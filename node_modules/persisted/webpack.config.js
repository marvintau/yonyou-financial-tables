const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	entry: './src/Persisted.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'index.js',
		library: 'persisted',
		libraryTarget: 'umd'
	},
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /node_modules/
			},
		]
	},

	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
				ecma: undefined,
				warnings: false,
				parse: {},
				compress: {},
				mangle: true,
				module: false,
				output: null,
				toplevel: false,
				nameCache: null,
				ie8: false,
				keep_classnames: undefined,
				keep_fnames: true, // change to true here
				safari10: false,
				},
			}),
		],
	},

	mode: 'production',
};