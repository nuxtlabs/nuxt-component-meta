export default {
  entries: [
    { input: 'src/index.ts', name: 'index' },
    { input: 'src/runtime/index.ts', name: 'runtime' }
  ],
  externals: ['#build', '#build/component-meta'],
  declaration: true
}
