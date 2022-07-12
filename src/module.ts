import { fileURLToPath } from 'url'
import fsp from 'fs/promises'
import { defineNuxtModule, resolveModule, addServerMiddleware } from '@nuxt/kit'
import type { Nitro } from 'nitropack'
import { parseComponent } from './utils/parse'

export interface ModuleOptions {
  addPlugin: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-component-meta',
    configKey: 'componentMeta'
  },
  defaults: {
    addPlugin: true
  },
  setup (options, nuxt) {
    if (options.addPlugin) {
      const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
      let nitro: Nitro
      nuxt.hook('components:extend', async (components) => {
        const componentMeta = await Promise.all(
          components.map(async (component) => {
            const name = (component as any).pascalName
            const path = resolveModule((component as any).filePath, { paths: nuxt.options.rootDir })
            const source = await fsp.readFile(path, { encoding: 'utf-8' })

            return parseComponent(name, source)
          })
        )

        nitro.options.virtual['#meta/virtual/meta'] = `export const components = ${JSON.stringify(componentMeta)}`
      })

      nuxt.hook('nitro:init', (_nitro) => {
        nitro = _nitro
      })

      addServerMiddleware({
        route: '/api/component-meta',
        handler: resolveModule('./server/api/component-meta.get', { paths: runtimeDir })
      })
      addServerMiddleware({
        route: '/api/component-meta/:component?',
        handler: resolveModule('./server/api/component-meta.get', { paths: runtimeDir })
      })
    }
  }
})
