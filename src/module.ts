import { fileURLToPath } from 'url'
import fsp from 'fs/promises'
import { defineNuxtModule, addPlugin, resolveModule, addServerMiddleware } from '@nuxt/kit'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { Nitro } from 'nitropack'

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

            // Parse component source
            const { descriptor } = parse(source)

            // Parse script
            const { props } = descriptor.scriptSetup
              ? parseSetupScript(name, descriptor)
              : {
                  props: []
                }

            const { slots } = parseTemplate(name, descriptor)

            return {
              name,
              props,
              slots
            }
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

function parseSetupScript (id: string, descriptor: SFCDescriptor) {
  const script = compileScript(descriptor, { id })
  const props = Object.entries(script.bindings).filter(([_name, type]) => type === 'props').map(([name]) => ({
    name,
    default: '?',
    type: '?',
    required: '?',
    values: '?',
    description: '?'
  }))
  return {
    props
  }
}

function parseTemplate (id: string, descriptor: SFCDescriptor) {
  if (!descriptor.template) {
    return {
      slots: []
    }
  }

  const template = compileTemplate({
    source: descriptor.template.content,
    id,
    filename: id
  })

  const findSlots = (nodes: any[]) => {
    if (!nodes.length) { return [] }
    const slots = nodes.filter(n => n.tag === 'slot').map(s => JSON.parse(s.codegenNode.arguments[1]))
    return [
      ...slots,
      ...findSlots(nodes.flatMap(n => n.children || []))
    ]
  }

  return {
    slots: findSlots(template.ast?.children || [])
  }
}
