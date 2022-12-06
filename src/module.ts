import { existsSync, readFileSync } from 'fs'
import type { MetaCheckerOptions } from 'vue-component-meta'
import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  resolveModule,
  addImportsDir,
  addTemplate
} from '@nuxt/kit'
import { join } from 'pathe'
import type { ComponentsDir, ComponentsOptions } from '@nuxt/schema'
import createJITI from 'jiti'
import { withoutLeadingSlash } from 'ufo'
import type { HookData } from './types'
import { metaPlugin } from './unplugin'

export interface ModuleOptions {
  outputDir?: string
  rootDir?: string
  silent?: boolean
  componentDirs: (string | ComponentsDir)[]
  components?: ComponentsOptions[]
  checkerOptions?: MetaCheckerOptions
  transformers?: ((component: any, code: string) => ({ component: any, code: string }))[]
}

export interface ModuleHooks {
  'component-meta:transformers'(data: HookData): void
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
    transformers: [
      // Normalize
      (component, code) => {
        if (!code.includes('<script')) {
          code += '\n<script setup>defineProps()</script>'
        }
        return { code, component }
      },
      // @nuxt/content support
      (component, code) => {
        code = code.replace(
          /<ContentSlot(.*)?:use="\$slots\.([a-z]+)"(.*)\/>/gm,
          (_, before, slotName, rest) => {
            return `<slot${slotName === 'default' ? '' : `name="${slotName}"`} />`
          }
        )

        return { component, code }
      }
    ],
    checkerOptions: {
      forceUseTs: true,
      schema: {}
    }
  }),
  async setup (options, nuxt) {
    // Regex to match colors.primary.100 in {colors.primary.100}

    const resolver = createResolver(import.meta.url)

    // Retrieve transformers
    let transformers = options?.transformers || []
    transformers = await nuxt.callHook('component-meta:transformers' as any, transformers)

    // Resolve loaded components
    let componentDirs: (string | ComponentsDir)[] = [...(options?.componentDirs || [])]
    let components: any[] = []
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

    addTemplate({
      filename: 'component-meta.mjs',
      getContents: () => 'export default {}',
      write: true
    })

    addTemplate({
      filename: 'component-meta.d.ts',
      getContents: () => [
        "import type { NuxtComponentMeta } from 'nuxt-component-meta'",
        'export type { NuxtComponentMeta }',
        `export type NuxtComponentMetaNames = ${components.map((c: { pascalName: any }) => `'${c.pascalName}'`).join(' | ')}`,
        'declare const components: Record<NuxtComponentMetaNames, NuxtComponentMeta>',
        'export { components as default,  components }'
      ].join('\n'),
      write: true
    })

    // Vite plugin
    nuxt.hook('vite:extend', (vite: any) => {
      vite.config.plugins = vite.config.plugins || []
      vite.config.plugins.push(metaPlugin.vite(options))
    })

    // Inject output alias
    nuxt.options.alias = nuxt.options.alias || {}
    nuxt.options.alias['#nuxt-component-meta'] = join(nuxt.options.buildDir, 'component-meta.mjs')
    nuxt.options.alias['#nuxt-component-meta/types'] = join(nuxt.options.buildDir, 'component-meta.d.ts')

    nuxt.hook('prepare:types', ({ tsConfig, references }) => {
      references.push({
        path: join(nuxt.options.buildDir, 'component-meta.d.ts')
      })
      tsConfig.compilerOptions = tsConfig.compilerOptions || {}
      tsConfig.compilerOptions.paths = tsConfig.compilerOptions.paths || {}
      tsConfig.compilerOptions.paths['#nuxt-component-meta'] = [withoutLeadingSlash(join(nuxt.options.buildDir, '/component-meta.mjs').replace(nuxt.options.rootDir, ''))]
      tsConfig.compilerOptions.paths['#nuxt-component-meta/types'] = [withoutLeadingSlash(join(nuxt.options.buildDir, '/component-meta.d.ts').replace(nuxt.options.rootDir, ''))]
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
      route: '/api/component-meta/:component?',
      handler: resolver.resolve('./runtime/server/api/component-meta.get')
    })
  }
})
