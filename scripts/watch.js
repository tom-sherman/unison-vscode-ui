const { build } = require('esbuild');

const config = require('./build-config');

build(config)
	.then(() => {
		console.log('Initial build complete, watching...');
		return build({
			...require('./build-config'),
			watch: {
				onRebuild(error, result) {
					if (error) {
						console.error('watch build failed:', error);
					} else {
						console.log('watch build succeeded:', result);
					}
				},
			},
		});
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
