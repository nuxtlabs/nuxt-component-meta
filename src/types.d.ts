export interface ComponentPropType {
  type: string | string[]
  elementType?: string
  as?: string | ComponentPropType
}

export interface ComponentProp {
  name: string
  type?: string | ComponentPropType | string[],
  default?: any
  required?: boolean,
  values?: any,
  description?: string
}

export interface ComponentSlot {
  name: string
}

export interface HookData {
  meta: {
    name: string
    global: boolean
    props: ComponentProp[]
    slots: ComponentSlot[]
  }
  path: string
  source: string
}
