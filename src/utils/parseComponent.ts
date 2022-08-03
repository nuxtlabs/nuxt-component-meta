import { parse } from '@vue/compiler-sfc'
import { extname } from 'pathe'
import type { ComponentProp } from '../types'
import { parseSetupScript } from './parseSetupScript'
import { parseScript } from './parseScript'
import { parseTemplate } from './parseTemplate'

export function parseComponent (name: string, source: string, options?: { filename?: string }) {
  // TODO: parse non-SFC components
  if (options?.filename && extname(options.filename) !== '.vue') {
    return { name, props: [], slots: [] }
  }

  // Parse SFC source
  const { descriptor } = parse(source, { filename: options?.filename })
  let props: ComponentProp[] = []
  let slots

  // Parse script
  if (descriptor.scriptSetup) {
    const setupScrip = parseSetupScript(name, descriptor)
    props = setupScrip.props
    slots = setupScrip.slots
  } else if (descriptor.script) {
    const script = parseScript(name, descriptor)
    props = script.props
    slots = script.slots
  }

  const template = parseTemplate(name, descriptor)

  return {
    name,
    props,
    slots: Array.from(new Set(template.slots.concat(slots)))
  }
}
