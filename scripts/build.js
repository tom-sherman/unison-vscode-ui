const { build } = require('esbuild');

build(require('./build-config')).catch((err) => {
	console.error(err);
	process.exit(1);
});
