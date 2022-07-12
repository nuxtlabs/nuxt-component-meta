import { readFile } from 'fs/promises'
import { defineNuxtModule, resolveModule, createResolver, addServerHandler } from '@nuxt/kit'
import { parseComponent } from './utils/parse'

export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-component-meta',
    configKey: 'componentMeta'
  },
  setup (_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    let componentMeta
    nuxt.hook('components:extend', async (components) => {
      componentMeta = await Promise.all(
        components.map(async (component) => {
          const name = (component as any).pascalName
          const path = resolveModule((component as any).filePath, { paths: nuxt.options.rootDir })
          const source = await readFile(path, { encoding: 'utf-8' })

          return parseComponent(name, source)
        })
      )
    })

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.virtual = nitroConfig.virtual || {}

      nitroConfig.virtual['#meta/virtual/meta'] = () => `export const components = ${JSON.stringify(componentMeta)}`
    })

    addServerHandler({
      method: 'get',
      route: '/api/component-meta',
      handler: resolver.resolve('./runtime/server/api/component-meta.get')
    })

    addServerHandler({
      method: 'get',
      route: '/api/component-meta/:component?',
      handler: resolver.resolve('./runtime/server/api/component-meta.get')
    })
  }
})
