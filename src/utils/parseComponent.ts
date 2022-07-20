import { parse } from '@vue/compiler-sfc'
import type { ComponentProp } from '../types'
import { parseSetupScript } from './parseSetupScript'
import { parseScript } from './parseScript'
import { parseTemplate } from './parseTemplate'

export function parseComponent (name: string, source: string) {
  // Parse component source
  const { descriptor } = parse(source)
  let props: ComponentProp[] = []

  // Parse script
  if (descriptor.scriptSetup) {
    const setupScrip = parseSetupScript(name, descriptor)
    props = setupScrip.props
  } else if (descriptor.script) {
    const script = parseScript(name, descriptor)
    props = script.props
  }

  const { slots } = parseTemplate(name, descriptor)

  return {
    name,
    props,
    slots
  }
}
