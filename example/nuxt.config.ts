import { resolve } from 'path'
import { withDocus } from '@docus/app/kit'

export default withDocus({
  rootDir: __dirname,
  buildModules: [resolve(__dirname, '../src/index.ts')]
})
