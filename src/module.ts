import type { MetaCheckerOptions } from 'vue-component-meta'
import {
  addServerHandler,
  addTemplate,
  createResolver,
  defineNuxtModule,
  resolveModule
} from '@nuxt/kit'

import { createComponentMetaChecker } from 'vue-component-meta'
import type { HookData } from './types'

export interface ModuleOptions {
  checkerOptions?: MetaCheckerOptions
}
export interface ModuleHooks {
  'component-meta:parsed'(data: HookData): void
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-component-meta',
    configKey: 'componentMeta'
  },
  setup (options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const tsconfigPath = resolver.resolve(nuxt.options.rootDir, 'tsconfig.json')
    const checker = createComponentMetaChecker(
      tsconfigPath,
      options.checkerOptions
    )

    function reducer (acc: any, component: any) {
      if (component.name) {
        acc[component.name] = component
      }

      return acc
    }

    async function mapper (component: any): Promise<HookData['meta']> {
      const path = resolveModule(component.filePath, {
        paths: nuxt.options.rootDir
      })

      console.log(component)

      const data = {
        meta: {
          name: component.pascalName,
          global: Boolean(component.global),
          props: [],
          slots: [],
          events: [],
          exposed: []
        },
        path,
        source: ''
      } as HookData

      try {
        const { props, slots, events, exposed } = checker.getComponentMeta(path)

        data.meta.slots = slots
        data.meta.events = events
        data.meta.exposed = exposed
        data.meta.props = props
          .filter(prop => !prop.global)
          .sort((a, b) => {
            // sort required properties first
            if (!a.required && b.required) {
              return 1
            }
            if (a.required && !b.required) {
              return -1
            }
            // then ensure boolean properties are sorted last
            if (a.type === 'boolean' && b.type !== 'boolean') {
              return 1
            }
            if (a.type !== 'boolean' && b.type === 'boolean') {
              return -1
            }

            return 0
          })

        // @ts-ignore
        await nuxt.callHook('component-meta:parsed', data)
      } catch (error: any) {
        console.error(`Unable to parse component "${path}": ${error}`)
      }

      return data.meta
    }

    let componentMeta: any
    let script = 'export const all = {}\nexport default all'
    let dts = "import type { NuxtComponentMeta } from 'nuxt-component-meta'"

    nuxt.hook('components:extend', async (components) => {
      componentMeta = (await Promise.all(components.map(mapper))).reduce(
        reducer,
        {}
      )

      script = `export const components = ${JSON.stringify(componentMeta)}`
      script += '\nexport default components'

      for (const key in componentMeta) {
        script += `\nexport const meta${key} = ${JSON.stringify(
          componentMeta[key]
        )}`
      }

      dts += `\ntype NuxtComponentMetaNames = ${Object.keys(componentMeta)
        .map(name => `"${name}"`)
        .join(' | ')}`
      dts += '\ndeclare const components: Record<NuxtComponentMetaNames, NuxtComponentMeta>'

      for (const key in componentMeta) {
        dts += `\ndeclare const meta${key}: NuxtComponentMeta`
      }
      dts += `\nexport { components as default, components, ${Object.keys(
        componentMeta
      )
        .map(name => `meta${name}`)
        .join(', ')} }`
    })

    const template = addTemplate({
      filename: 'nuxt-component-meta.mjs',
      getContents: () => script
    })
    addTemplate({
      filename: 'nuxt-component-meta.d.ts',
      getContents: () => dts,
      write: true
    })
    nuxt.options.alias['#nuxt-component-meta'] = template.dst!

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.virtual = nitroConfig.virtual || {}

      nitroConfig.virtual['#meta/virtual/meta'] = () =>
        `export const components = ${JSON.stringify(
          componentMeta
        )}\nexport default components`
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
