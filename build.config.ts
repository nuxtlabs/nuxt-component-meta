export default {
  entries: [
    { input: 'src/module.ts', name: 'module' },
    { input: 'src/runtime/index.ts', name: 'runtime' }
  ],
  externals: ['#build', '#build/component-meta.mjs'],
  declaration: true
}
