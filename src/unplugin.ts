import { createUnplugin } from 'unplugin'
import { ComponentMetaParser, useComponentMetaParser, type ComponentMetaParserOptions } from './parser'

type ComponentMetaUnpluginOptions = { parser?: ComponentMetaParser, parserOptions: ComponentMetaParserOptions }

export const metaPlugin = createUnplugin<ComponentMetaUnpluginOptions>(
  ({ parser, parserOptions }) => {
    const instance = parser || useComponentMetaParser(parserOptions)
    let _configResolved: any

    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      async buildStart () {
        // avoid parsing meta twice in SSR
        if (_configResolved?.build.ssr) {
          return
        }
        await instance.fetchComponents()
        await instance.updateOutput()
      },
      vite: {
        configResolved (config) {
          _configResolved = config
        },
        async handleHotUpdate ({ file }) {
          if (Object.entries(instance.components).some(([, comp]: any) => comp.fullPath === file)) {
            await instance.fetchComponent(file)
            await instance.updateOutput()
          }
        }
      }
    }
  })
