import { pascalCase } from 'scule'
// @ts-ignore
import { components as _components } from '#build/component-meta.mjs'

export interface ComponentPropMeta {
  name: string
  type: string[]
  default?: string
  required?: boolean
  values?: string[]
  description?: string
}

export interface ComponentMeta {
  name: string
  description?: string
  slots?: any[]
  props: ComponentPropMeta[]
}

export const components = _components as ComponentMeta[]

export const getComponent = (name: string): ComponentMeta | undefined => {
  name = pascalCase(name)
  return components.find(c => c.name === name)
}
