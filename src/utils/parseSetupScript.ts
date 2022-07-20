import type { SFCDescriptor } from '@vue/compiler-sfc'
import { compileScript } from '@vue/compiler-sfc'
import { ComponentProp } from '../types'
import { visit } from './ast'

export function parseSetupScript (id: string, descriptor: SFCDescriptor) {
  const props: ComponentProp[] = []
  const script = compileScript(descriptor, { id })

  function getValue (prop) {
    if (!prop?.type) {
      return undefined
    }
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
  function getType (tsProperty) {
    const { type, typeName, elementType } = tsProperty.typeAnnotation?.typeAnnotation || tsProperty
    switch (type) {
      case 'TSStringKeyword':
        return 'String'
      case 'TSNumberKeyword':
        return 'Number'
      case 'TSBooleanKeyword':
        return 'Boolean'
      case 'TSObjectKeyword':
        return 'Object'
      case 'TSTypeReference':
        return typeName.name
      case 'TSArrayType':
        return {
          type: 'Array',
          elementType: getType(elementType)
        }
    }
  }

  visit(script.scriptSetupAst, node => node.type === 'CallExpression' && node.callee?.name === 'defineProps', (node) => {
    const properties = node.arguments[0]?.properties || []
    properties.reduce((props, p) => {
      if (p.type === 'ObjectProperty') {
        props.push({
          name: p.key.name,
          ...getValue(p.value)
        })
      }
      return props
    }, props)
    visit(node, n => n.type === 'TSPropertySignature', (property) => {
      const name = property.key.name
      props.push({
        name,
        required: !property.optional,
        type: getType(property)
      })
    })
  })

  return {
    props
  }
}
