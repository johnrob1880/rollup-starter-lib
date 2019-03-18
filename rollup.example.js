import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        resolve()
    ]
}