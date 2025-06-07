import { createUnplugin } from 'unplugin'
import { type ComponentMetaParser, useComponentMetaParser, type ComponentMetaParserOptions } from './parser'
import type { Nuxt } from 'nuxt/schema'

type ComponentMetaUnpluginOptions = { nuxt: Nuxt, parser?: ComponentMetaParser, parserOptions: ComponentMetaParserOptions, parseAtBuild?: boolean }

// @ts-ignore -- arguments types are not correct
export const metaPlugin = createUnplugin<ComponentMetaUnpluginOptions>(({ nuxt, parser, parserOptions, parseAtBuild }) => {
    const instance = parser || useComponentMetaParser(parserOptions)
    let _configResolved: any

    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      buildStart () {
        // avoid parsing meta twice in SSR
        if (_configResolved?.build.ssr || parseAtBuild) {
          return
        }

        instance.fetchComponents()
        nuxt.callHook('component-meta:parsed', instance.components)
        instance.updateOutput()
      },
      vite: {
        configResolved (config) {
          _configResolved = config
        },
        handleHotUpdate ({ file }) {
          if (Object.entries(instance.components).some(([, comp]: any) => comp.fullPath === file)) {
            nuxt.callHook('component-meta:hot-reloaded', instance.fetchComponent(file))
            instance.updateOutput()
          }
        }
      }
    }
  })
