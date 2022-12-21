import { createUnplugin } from 'unplugin'
import { ComponentMetaParser } from './parser'

export const metaPlugin = createUnplugin<{ parser: ComponentMetaParser }>(
  (options) => {
    const parser = options.parser
    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      async buildStart () {
        await parser.fetchComponents()
        await parser.updateOutput()
      },
      vite: {
        async handleHotUpdate ({ file }) {
          if (Object.entries(parser.getComponents()).some(([, comp]: any) => comp.fullPath === file)) {
            await parser.fetchComponent(file)
            await parser.updateOutput()
          }
        }
      }
    }
  })
