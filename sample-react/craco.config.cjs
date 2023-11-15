// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack');

module.exports = {
	webpack: {
		configure: (webpackConfig) => {
			const fallback = webpackConfig.resolve.fallback || {};
			Object.assign(fallback, {
				crypto: require.resolve('crypto-browserify'),
				stream: require.resolve('stream-browserify'),
			});
			webpackConfig.resolve.fallback = fallback;
			webpackConfig.resolve.symlinks = false;
			webpackConfig.plugins = (webpackConfig.plugins || []).concat([
				new webpack.ProvidePlugin({
					Buffer: ['buffer', 'Buffer'],
				}),
			]);
			return webpackConfig;
		},
	},
};
