import { readFileSync } from 'fs'
import type { MetaCheckerOptions } from 'vue-component-meta'
import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  resolveModule,
  addImportsDir
} from '@nuxt/kit'
import { join } from 'pathe'
import type { ComponentsDir, ComponentsOptions } from '@nuxt/schema'
import { withoutLeadingSlash } from 'ufo'
import type { HookData } from './types'
import { metaPlugin, storagePlugin } from './unplugin'

export interface ModuleOptions {
  outputDir?: string
  rootDir?: string
  silent?: boolean
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
    silent: true,
    checkerOptions: {
      forceUseTs: true,
      schema: {}
    }
  }),
  setup (options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Resolve loaded components
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

    // Add useComponentMeta
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Vite plugin
    nuxt.hook('vite:extend', (vite: any) => {
      vite.config.plugins = vite.config.plugins || []
      vite.config.plugins.push(storagePlugin)
      vite.config.plugins.push(metaPlugin.vite(options))
    })

    nuxt.hook('prepare:types', ({ tsConfig }) => {
      tsConfig.compilerOptions.paths = tsConfig.compilerOptions.paths || {}
      tsConfig.compilerOptions.paths['#nuxt-component-meta'] = [withoutLeadingSlash(join(nuxt.options.buildDir, '/component-meta-cache.mjs').replace(nuxt.options.rootDir, ''))]
      // tsConfig.compilerOptions.paths['#nuxt-component-meta/types'] = [withoutLeadingSlash(join(nuxt.options.buildDir, '/component-meta-cache.ts').replace(nuxt.options.rootDir, ''))]
    })

    // Nitro setup
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.virtual = nitroConfig.virtual || {}
      nitroConfig.virtual['#meta/virtual/meta'] = () => readFileSync(join(nuxt.options.buildDir, '/component-meta-cache.mjs'), 'utf-8')
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
