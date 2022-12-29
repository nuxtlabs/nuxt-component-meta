import { createUnplugin } from 'unplugin'
import { ModuleOptions } from './options'
import { ComponentMetaParser, useComponentMetaParser } from './parser'

type ComponentMetaUnpluginOptions = { parser?: ComponentMetaParser } & ModuleOptions

export const metaPlugin = createUnplugin<ComponentMetaUnpluginOptions>(
  ({ parser, ...options }) => {
    const instance = (parser || useComponentMetaParser(options)) as ComponentMetaParser

    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      async buildStart () {
        await instance.fetchComponents()
        await instance.updateOutput()
      },
      vite: {
        async handleHotUpdate ({ file }) {
          if (Object.entries(instance.components).some(([, comp]: any) => comp.fullPath === file)) {
            await instance.fetchComponent(file)
            await instance.updateOutput()
          }
        }
      }
    }
  })
