import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
  entry: 'lib/index.js',
  plugins: [
    commonjs(),
    babel(babelrc()),
    resolve({
      jsnext: true
    })
  ],
  external: external,
  context: 'window',
  targets: [
    {
      dest: pkg.main,
      format: 'umd',
      moduleName: 'archimedeanSpiral',
      sourceMap: true
    },
    {
      dest: pkg.module,
      format: 'es',
      sourceMap: true
    }
  ]
};
