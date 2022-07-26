import { readFile } from 'fs/promises'
import { defineNuxtModule, resolveModule, createResolver, addServerHandler, addVitePlugin } from '@nuxt/kit'
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

    addVitePlugin({
      name: 'nuxt-component-meta-loader',
      resolveId (id) {
        if (id === 'virtual:nuxt-component-meta') {
          return '\0virtual:nuxt-component-meta'
        }
      },
      load (id) {
        if (id === '\0virtual:nuxt-component-meta') {
          let script = `export const meta = ${JSON.stringify(componentMeta)}`
          script += 'export default meta'

          for (const component of componentMeta) {
            script += `\nexport const ${component.name}Meta = ${JSON.stringify(
              component
            )}`
          }

          return script
        }
      }
    })
  }
})
