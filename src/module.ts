import type { MetaCheckerOptions } from 'vue-component-meta'
import {
  addServerHandler,
  addTemplate,
  createResolver,
  defineNuxtModule,
  resolveModule
} from '@nuxt/kit'

import { createComponentMetaCheckerByJsonConfig } from 'vue-component-meta'
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
  defaults: () => ({
    checkerOptions: {
      forceUseTs: true,
      schema: {}
    }
  }),
  setup (options, nuxt) {
    const resolver = createResolver(import.meta.url)

    let componentMeta: any = {}
    let componentDirs: any[] = []

    // default to empty permisive object if no componentMeta is defined
    const script = ['export const components = {}', 'export default components']
    const dts = [
      "import type { NuxtComponentMeta } from 'nuxt-component-meta'",
      'export type { NuxtComponentMeta }',
      'export type NuxtComponentMetaNames = string',
      'declare const components: Record<NuxtComponentMetaNames, NuxtComponentMeta>',
      'export { components as default,  components }'
    ]

    nuxt.hook('components:dirs', (dirs) => {
      componentDirs = [
        ...dirs,
        { path: resolveModule('nuxt').replace('/index.mjs', '/app') },
        { path: resolveModule('@nuxt/ui-templates').replace('/index.mjs', '/templates') }
      ]
    })
    nuxt.hook('components:extend', async (components) => {
      const includeDirs = componentDirs.map(dir => `${dir.path}/**/*`)
      const checker = createComponentMetaCheckerByJsonConfig(
        nuxt.options.rootDir,
        {
          extends: `${nuxt.options.rootDir}/tsconfig.json`,
          skipLibCheck: false,
          include: [
            '**/*',
            ...includeDirs
          ],
          exclude: []
        },
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

        if (!checker) {
          return data.meta
        }

        try {
          const { props, slots, events, exposed } = checker?.getComponentMeta(path)

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

      componentMeta = (await Promise.all(components.map(mapper))).reduce(
        reducer,
        {}
      )

      // generate virtual script
      script.splice(0, script.length)
      script.push(`export const components = ${JSON.stringify(componentMeta)}`)
      script.push('export default components')

      for (const key in componentMeta) {
        script.push(`export const meta${key} = ${JSON.stringify(
          componentMeta[key]
        )}`)
      }

      // generate typescript definition file
      const componentMetaKeys = Object.keys(componentMeta)
      const componentNameString = componentMetaKeys.map(name => `"${name}"`)
      const exportNames = componentMetaKeys.map(name => `meta${name}`)

      dts.splice(2, script.length) // keep the two first lines (import type and export NuxtComponentMeta)
      dts.push(`export type NuxtComponentMetaNames = ${componentNameString.join(' | ')}`)
      dts.push('declare const components: Record<NuxtComponentMetaNames, NuxtComponentMeta>')

      for (const exportName of exportNames) {
        dts.push(`declare const ${exportName}: NuxtComponentMeta`)
      }

      dts.push(`export { components as default, components, ${exportNames.join(', ')} }`)
    })

    const template = addTemplate({
      filename: 'nuxt-component-meta.mjs',
      getContents: () => script.join('\n')
    })
    addTemplate({
      filename: 'nuxt-component-meta.d.ts',
      getContents: () => dts.join('\n'),
      write: true
    })
    nuxt.options.alias['#nuxt-component-meta'] = template.dst!

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.virtual = nitroConfig.virtual || {}

      nitroConfig.virtual['#meta/virtual/meta'] = () => script.join('\n')
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
