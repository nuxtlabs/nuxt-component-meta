import { readFile } from 'fs/promises'
import { defineNuxtModule, resolveModule, createResolver, addServerHandler } from '@nuxt/kit'
import { parseComponent } from './utils/parseComponent'
import type { ComponentProp, ComponentSlot, HookData } from './types'

export interface ModuleOptions {}

export interface ModuleHooks {
  'component-meta:parsed'(data: HookData): void
}

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
          const path = resolveModule((component as any).filePath, { paths: nuxt.options.rootDir })
          const source = await readFile(path, { encoding: 'utf-8' })

          const data: HookData = {
            meta: {
              name: (component as any).pascalName,
              global: Boolean(component.global),
              props: [] as ComponentProp[],
              slots: [] as ComponentSlot[]
            },
            path,
            source
          }

          const { props, slots } = parseComponent(data.meta.name, source)
          data.meta.props = props
          data.meta.slots = slots

          // @ts-ignore
          await nuxt.callHook('component-meta:parsed', data)

          return data.meta
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
