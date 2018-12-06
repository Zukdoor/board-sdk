import babel from 'rollup-plugin-babel'
// import commonjs from 'rollup-plugin-commonjs'
// import json from 'rollup-plugin-json'
import resolve from 'rollup-plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'
import {uglify} from 'rollup-plugin-uglify'
import pkg from './package.json'

const defaultPlugins = [resolve(), babel()]

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'BoardSDK',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [...defaultPlugins, uglify()],
  },
  // FIXME: es and cjs outputs should be merged
  // They are splitted for now as a workaround
  // for rollup-plugin-terser.
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,
      format: 'es',
    },
    plugins: [...defaultPlugins, terser()],
  },
  {
    input: 'src/index.js',
    output: {
      file: pkg.main,
      format: 'cjs',
    },
    plugins: [...defaultPlugins, terser()],
  },
]
