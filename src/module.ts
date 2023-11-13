import { readFileSync } from 'fs'
import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  resolveModule,
  addImportsDir,
  addTemplate
} from '@nuxt/kit'
import { join } from 'pathe'
import type { ComponentsDir, Component } from '@nuxt/schema'
import { metaPlugin } from './unplugin'
import type { ModuleOptions } from './options'
import { type ComponentMetaParser, useComponentMetaParser, type ComponentMetaParserOptions } from './parser'
import { loadExternalSources } from './loader'
import type { NuxtComponentMeta } from './types'

export * from './options'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-component-meta',
    configKey: 'componentMeta'
  },
  defaults: nuxt => ({
    outputDir: nuxt.options.buildDir,
    rootDir: nuxt.options.rootDir,
    componentDirs: [],
    components: [],
    metaSources: [],
    silent: true,
    exclude: ['nuxt/dist/app/components/client-only', 'nuxt/dist/app/components/dev-only'],
    metaFields: {
      type: true,
      props: true,
      slots: true,
      events: true,
      exposed: true
    },
    transformers: [
      // @nuxt/content support
      (component, code) => {
        code = code.replace(
          /<ContentSlot(.*)?:use="\$slots\.([a-z]+)"(.*)\/>/gm,
          (_, _before, slotName, _rest) => {
            return `<slot ${slotName === 'default' ? '' : `name="${slotName}"`} />`
          }
        )

        return { component, code }
      }
    ],
    checkerOptions: {
      forceUseTs: true,
      schema: {
        ignore: [
          'NuxtComponentMetaNames', // avoid loop
          'RouteLocationRaw', // vue router
          'RouteLocationPathRaw', // vue router
          'RouteLocationNamedRaw', // vue router
          'ComputedStyleProp', // Pinceau
          'VariantProp' // Pinceau
        ]
      }
    },
    globalsOnly: false
  }),
  async setup (options, nuxt) {
    const resolver = createResolver(import.meta.url)

    let parser: ComponentMetaParser
    const parserOptions: ComponentMetaParserOptions = {
      ...options,
      components: [],
      metaSources: {}
    }

    // Retrieve transformers
    let transformers = options?.transformers || []
    transformers = await nuxt.callHook('component-meta:transformers' as any, transformers)

    // Resolve loaded components
    let componentDirs: (string | ComponentsDir)[] = [...(options?.componentDirs || [])]
    let components: Component[] = []
    let metaSources: NuxtComponentMeta = {}

    nuxt.hook('components:dirs', (dirs) => {
      componentDirs = [
        ...componentDirs,
        ...dirs,
        { path: resolveModule('nuxt').replace('/index.mjs', '/app') },
        { path: resolveModule('@nuxt/ui-templates').replace('/index.mjs', '/templates') }
      ]
      options.componentDirs = componentDirs
    })
    nuxt.hook('components:extend', async (_components) => {
      components = _components

      // Support `globalsOnly` option
      if (options?.globalsOnly) { components = components.filter(c => c.global) }

      // Load external components definitions
      metaSources = await loadExternalSources(options.metaSources)

      // Allow to extend parser options
      parserOptions.components = components
      parserOptions.metaSources = metaSources
      await nuxt.callHook('component-meta:extend' as any, parserOptions)

      // Create parser once all necessary contexts has been resolved
      parser = useComponentMetaParser(parserOptions)

      // Stub output in case it does not exist yet
      await parser.stubOutput()
    })

    // Add useComponentMeta
    addImportsDir(resolver.resolve('./runtime/composables'))

    addTemplate({
      filename: 'component-meta.mjs',
      getContents: () => 'export default {}',
      write: true
    })

    addTemplate({
      filename: 'component-meta.d.ts',
      getContents: () => [
        "import type { ComponentData } from 'nuxt-component-meta'",
        `export type NuxtComponentMetaNames = ${
          [...components, ...Object.values(metaSources)].map(c => `'${c.pascalName}'`).join(' | ')
        }`,
        'export type NuxtComponentMeta = Record<NuxtComponentMetaNames, ComponentData>',
        'declare const components: NuxtComponentMeta',
        'export { components as default, components }'
      ].join('\n'),
      write: true
    })

    // Vite plugin
    nuxt.hook('vite:extend', (vite: any) => {
      vite.config.plugins = vite.config.plugins || []
      vite.config.plugins.push(metaPlugin.vite({ parser, parserOptions }))
    })

    // Inject output alias
    nuxt.options.alias = nuxt.options.alias || {}
    nuxt.options.alias['#nuxt-component-meta'] = join(nuxt.options.buildDir, 'component-meta.mjs')
    nuxt.options.alias['#nuxt-component-meta/types'] = join(nuxt.options.buildDir, 'component-meta.d.ts')

    nuxt.hook('prepare:types', ({ tsConfig, references }) => {
      references.push({
        path: join(nuxt.options.buildDir, 'component-meta.d.ts')
      })
    })

    // Nitro setup
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.virtual = nitroConfig.virtual || {}
      nitroConfig.virtual['#nuxt-component-meta/nitro'] = () => readFileSync(join(nuxt.options.buildDir, '/component-meta.mjs'), 'utf-8')
    })
    addServerHandler({
      method: 'get',
      route: '/api/component-meta',
      handler: resolver.resolve('./runtime/server/api/component-meta.get')
    })
    addServerHandler({
      method: 'get',
      route: '/api/component-meta.json',
      handler: resolver.resolve('./runtime/server/api/component-meta.get')
    })
    addServerHandler({
      method: 'get',
      route: '/api/component-meta/:component?',
      handler: resolver.resolve('./runtime/server/api/component-meta.get')
    })
  }
})
