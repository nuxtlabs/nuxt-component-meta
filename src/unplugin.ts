import { createUnplugin } from 'unplugin'
import { type ComponentMetaParser, useComponentMetaParser, type ComponentMetaParserOptions } from './parser'

type ComponentMetaUnpluginOptions = { parser?: ComponentMetaParser, parserOptions: ComponentMetaParserOptions }

// @ts-ignore -- arguments types are not correct
export const metaPlugin = createUnplugin<ComponentMetaUnpluginOptions>(({ parser, parserOptions }) => {
    const instance = parser || useComponentMetaParser(parserOptions)
    let _configResolved: any

    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      buildStart () {
        // avoid parsing meta twice in SSR
        if (_configResolved?.build.ssr) {
          return
        }

        instance.fetchComponents()
        instance.updateOutput()
      },
      vite: {
        configResolved (config) {
          _configResolved = config
        },
        handleHotUpdate ({ file }) {
          if (Object.entries(instance.components).some(([, comp]: any) => comp.fullPath === file)) {
            instance.fetchComponent(file)
            instance.updateOutput()
          }
        }
      }
    }
  })
