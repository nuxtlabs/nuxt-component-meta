import { createUnplugin } from 'unplugin'
import { ModuleOptions } from './options'
import { ComponentMetaParser, useComponentMetaParser } from './parser'

type ComponentMetaUnpluginOptions = { parser?: ComponentMetaParser } & ModuleOptions

export const metaPlugin = createUnplugin<ComponentMetaUnpluginOptions>(
  ({ parser, ...options }) => {
    const instance = (parser || useComponentMetaParser(options)) as ComponentMetaParser
    let _configResolved: any

    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      async buildStart () {
        // avoid parsing meta twice
        if (_configResolved && !_configResolved.build.ssr) {
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
