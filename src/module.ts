import { readFile } from 'fs/promises'
import { defineNuxtModule, resolveModule, createResolver, addServerHandler } from '@nuxt/kit'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import type { SFCDescriptor } from '@vue/compiler-sfc'

export interface ModuleOptions {}

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
          const name = (component as any).pascalName
          const path = resolveModule((component as any).filePath, { paths: nuxt.options.rootDir })
          const source = await readFile(path, { encoding: 'utf-8' })

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
