import type { MetaCheckerOptions } from 'vue-component-meta'
import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  resolveModule
} from '@nuxt/kit'
import { join } from 'pathe'

import type { ComponentsDir, ComponentsOptions } from '@nuxt/schema'
import type { HookData } from './types'
import unplugin from './unplugin'

export interface ModuleOptions {
  outputDir?: string
  rootDir?: string
  componentDirs: (string | ComponentsDir)[]
  components?: ComponentsOptions[]
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
  defaults: nuxt => ({
    outputDir: nuxt.options.buildDir,
    rootDir: nuxt.options.rootDir,
    componentDirs: [],
    components: [],
    checkerOptions: {
      forceUseTs: true,
      schema: {}
    }
  }),
  setup (options, nuxt) {
    const resolver = createResolver(import.meta.url)

    let componentDirs: (string | ComponentsDir)[] = [...(options?.componentDirs || [])]
    let components = []

    nuxt.hook('components:dirs', (dirs) => {
      componentDirs = [
        ...componentDirs,
        ...dirs,
        { path: resolveModule('nuxt').replace('/index.mjs', '/app') },
        { path: resolveModule('@nuxt/ui-templates').replace('/index.mjs', '/templates') }
      ]
      options.componentDirs = componentDirs
    })

    nuxt.hook('components:extend', (_components) => {
      components = _components
      options.components = components
    })

    // Webpack plugin
    nuxt.hook('webpack:config', (config: any) => {
      config.plugins = config.plugins || []
      config.plugins.unshift(unplugin.webpack(options))
    })
    // Vite plugin
    nuxt.hook('vite:extend', (vite: any) => {
      vite.config.plugins = vite.config.plugins || []
      vite.config.plugins.push(unplugin.vite(options))
    })

    // Nitro setup
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.virtual = nitroConfig.virtual || {}
      nitroConfig.virtual['#meta/virtual/meta'] = () => `export * from '${join(nuxt.options.buildDir, '/component-meta.mjs')}'`
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
