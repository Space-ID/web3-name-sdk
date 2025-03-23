import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json'; // 新增
// import babel from '@rollup/plugin-babel';

export default {
    input: 'src/index.ts', // 你的入口文件
    output: {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: '@web3-name-sdk/core', // UMD 全局变量名
        globals: {
            lodash: "_", // 如果你的库依赖 lodash，则这里定义它的外部依赖
        },
        inlineDynamicImports: true, // 关键修复
    },
    external: ["lodash"], // 指定外部依赖
    plugins: [
        //  解析 node_modules 里的模块
        // 转换 CommonJS 模块
        resolve(),
        json(), 
        commonjs({ ignoreDynamicRequires: true }),
        typescript({ tsconfig: './tsconfig.json' }),
        // babel({ babelHelpers: 'bundled' })
    ],
};