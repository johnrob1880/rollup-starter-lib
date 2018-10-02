import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/main.js',
		output: {
			name: 'howLongUntilLunch',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve(), // so Rollup can find node modules
			commonjs(), // so Rollup can convert node modules to an ES modules
			babel({
				exclude: 'node_modules/**' // only transpile our source code
			})
		]
	},

	// CommonJS (for Node)
	{
		input: 'src/main.js',
		external: ['ms'],
		output: [
			{ file: pkg.main, format: 'cjs' }
		],
		plugins: [
			babel({
				exclude: 'node_modules/**' // only transpile our source code
			})
		]
	},
	// ES module (for bundlers)
	{
		input: 'src/main.js',
		external: ['ms'],
		output: [
			{ file: pkg.module, format: 'es' }
		]
	}
];
