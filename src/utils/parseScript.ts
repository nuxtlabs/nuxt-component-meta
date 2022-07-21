import type { SFCDescriptor } from '@vue/compiler-sfc'
import { compileScript } from '@vue/compiler-sfc'
import { ComponentProp } from '../types'
import { getType, getValue, visit } from './ast'
import { findSlotUsage } from './source'

export function parseScript (id: string, descriptor: SFCDescriptor) {
  const props: ComponentProp[] = []
  const script = compileScript(descriptor, { id })

  const slots = findSlotUsage(script.content)

  visit(script.scriptAst, node => node.type === 'CallExpression' && node.callee?.name === 'defineComponent', (node) => {
    const nodeProps = node.arguments?.[0]?.properties?.find(prop => prop.key.name === 'props')
    if (!nodeProps) {
      return
    }
    const properties = nodeProps.value.properties || []
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
    props,
    slots
  }
}
