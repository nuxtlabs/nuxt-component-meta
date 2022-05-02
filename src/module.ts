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

  function getValue (prop) {
    if (prop.type.endsWith('Literal')) {
      return prop.value
    }

    if (prop.type === 'Identifier') {
      return prop.name
    }

    if (prop.type === 'ObjectExpression') {
      return prop.properties.reduce((acc, prop) => {
        acc[prop.key.name] = getValue(prop.value)
        return acc
      }, {})
    }
  }
  const props = []
  visit(script.scriptSetupAst, node => node.type === 'CallExpression' && node.callee?.name === 'defineProps', (node) => {
    const properties = node.arguments[0]?.properties || []
    properties.reduce((props, p) => {
      props.push({
        name: p.key.name,
        // default: '?',
        // type: '?',
        // required: '?',
        // values: '?',
        // description: '?',
        ...getValue(p.value)
      })
      return props
    }, props)
  })

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

function visit (node, test, visitNode) {
  if (Array.isArray(node)) {
    return node.forEach(n => visit(n, test, visitNode))
  }

  if (!node.type) { return }

  if (test(node)) {
    visitNode(node)
  }

  switch (node.type) {
    case 'VariableDeclaration':
      visit(node.declarations, test, visitNode)
      break
    case 'VariableDeclarator':
      visit(node.id, test, visitNode)
      visit(node.init, test, visitNode)
      break
    case 'CallExpression':
      visit(node.callee, test, visitNode)
      visit(node.arguments, test, visitNode)
      break
    case 'ObjectExpression':
      visit(node.properties, test, visitNode)
      break
    case 'ObjectProperty':
      visit(node.key, test, visitNode)
      visit(node.value, test, visitNode)
      break
  }
}
