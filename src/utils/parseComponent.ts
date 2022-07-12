import { parse } from '@vue/compiler-sfc'
import { parseSetupScript } from './parseSetupScript'
import { parseTemplate } from './parseTemplate'

export function parseComponent (name: string, source: string) {
  // Parse component source
  const { descriptor } = parse(source)

  // Parse script
  const { props } = descriptor.scriptSetup
    ? parseSetupScript(name, descriptor)
    : { props: [] }

  const { slots } = parseTemplate(name, descriptor)

  return {
    name,
    props,
    slots
  }
}
