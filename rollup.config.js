import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/index.js',
		output: {
			name: 'restyled',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve(),
			commonjs(),
			babel({
				exclude: 'node_modules/**'
			})
		]
	},
	// CommonJS (for Node)
	{
		input: 'src/index.js',
		output: [
			{ file: pkg.main, format: 'cjs' }
		],
		plugins: [
			babel({
				exclude: 'node_modules/**'
			})
		]
	},
	// ES module (for bundlers)
	{
		input: 'src/index.js',
		output: [
			{ file: pkg.module, format: 'es' }
		]
	}
];
