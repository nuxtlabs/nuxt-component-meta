import { readFile } from 'fs/promises'
import { defineNuxtModule, resolveModule, createResolver, addServerHandler } from '@nuxt/kit'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import * as ts from 'typescript'

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
          const props = []

          // Parse component source
          const { descriptor } = parse(source)

          if (descriptor.scriptSetup?.lang === 'ts') {
            // parse typescript setup script
            const parsed = parseTSSetupScript(name, descriptor)
            props.push(...parsed.props)
          } else if (descriptor.scriptSetup) {
            const parsed = parseSetupScript(name, descriptor)
            props.push(...parsed.props)
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

function parseTSSetupScript (id: string, descriptor: SFCDescriptor) {
  const props = []

  // const program = ts.createProgram([`${id}.vue.ts`], {})
  const source = ts.createSourceFile(
    `${id}.vue.ts`,
    descriptor.scriptSetup.content,
    ts.ScriptTarget.Latest,
    true
  )

  // 1. extract file infos (types, extrernal types and defineProps / defineEmits calls)
  ts.forEachChild(source, (node) => {
    if (ts.isImportDeclaration(node)) {
      // extract imported types
      const path = node.moduleSpecifier.getText()
      let imports = []

      if (node.importClause.isTypeOnly && node.importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
        imports = node.importClause.namedBindings.elements.map(e => e.name.text)
      }

      console.log({
        path,
        imports
      })
    } else if (ts.isTypeAliasDeclaration(node)) {
      // extract type aliases
      const name = node.name.text
      const type = node.type.getText()

      console.log({
        name,
        type
      })
    } else if (ts.isInterfaceDeclaration(node)) {
      // extract interfaces

      const name = node.name.escapedText
      const members = node.members.map((m, index) => {
        if (ts.isCallSignatureDeclaration(m)) {
          // call signatures should be emits declarations
          // extract call parameters
          console.log(m.typeParameters)
          return {
            key: index,
            type: m.getText()
          }
        } else if (ts.isPropertySignature(m)) {
          // members should be properties
          return {
            key: m.name.getText(),
            type: m.type.getText()
          }
        }

        return {
          key: 'unknown',
          type: 'unknown'
        }
      })
      console.log({
        name,
        members
      })
    } else if (ts.isVariableStatement(node)) {
      // here we need to find defineEmits / withDefaults / defineProps calls
      // and extract either the generic type info or the default value of destructured props
      console.log(node.kind)
    }
  })

  // 2. resolve defineProps / defineEmits type parameters to the actual types

  return {
    props
  }
}
