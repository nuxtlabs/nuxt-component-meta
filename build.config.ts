export default {
  entries: [
    { input: 'src/module.ts', name: 'module' },
    { input: 'src/runtime/index.ts', name: 'index' }
  ],
  externals: ['#build', '#build/component-meta'],
  declaration: true
}
