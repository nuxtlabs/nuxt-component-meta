import { parse } from '@vue/compiler-sfc'
import { parseTSSetupScript } from './parseTSSetupScript'
import { parseSetupScript } from './parseSetupScript'
import { parseTemplate } from './parseTemplate'

export function parseComponent (name: string, source: string) {
  // Parse component source
  const { descriptor } = parse(source)
  const props = []

  // Parse script
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
}
