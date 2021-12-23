/**
 * @type {import("esbuild").BuildOptions}
 */
module.exports = {
	entryPoints: ['./src/extension.ts'],
	outdir: './dist',
	bundle: true,
	platform: 'node',
	target: 'node16',
	sourcemap: 'external',
	format: 'cjs',
	external: ['vscode'],
};
