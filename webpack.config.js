const path = require('path');

module.exports = {
	mode: 'development',
	entry: './prebuild/index.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'public', 'js')
	}
};
