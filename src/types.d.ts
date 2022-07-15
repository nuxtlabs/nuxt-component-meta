export interface ComponentPropType {
  type: string
}

export interface ComponentProp {
    name: string
    type?: string | ComponentPropType,
    default?: any
    required?: boolean,
    values?: any,
    description?: string
}
