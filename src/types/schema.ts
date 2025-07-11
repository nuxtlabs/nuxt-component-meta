
export interface JsonSchema {
  type?: string
  properties?: Record<string, any>
  required?: string[]
  description?: string
  default?: any
  anyOf?: any[]
}