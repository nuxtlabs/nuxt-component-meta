import type { ComponentMeta, PropertyMetaSchema } from 'vue-component-meta'
import type { JsonSchema } from '../types/schema'

/**
 * Converts Vue component props metadata to JSON Schema format
 * @param props Array of Vue component prop metadata
 * @returns JSON Schema object
 */
export function propsToJsonSchema(props: ComponentMeta['props']): JsonSchema {
  const schema: JsonSchema = {
    type: 'object',
    properties: {},
    required: []
  }

  for (const prop of props) {
    const propSchema: any = {}

    // Add description (only if non-empty)
    if (prop.description) {
      propSchema.description = prop.description
    }

    // Convert Vue prop type to JSON Schema type
    const propType = convertVueTypeToJsonSchema(prop.type, prop.schema as any)
    Object.assign(propSchema, propType)

    // Add default value if available and not already present, only for primitive types or for object with '{}'
    if (prop.default !== undefined && propSchema.default === undefined) {
      propSchema.default = parseDefaultValue(prop.default)
    }

    // Add the property to the schema
    schema.properties![prop.name] = propSchema

    // Add to required array if the prop is required
    if (prop.required) {
      schema.required!.push(prop.name)
    }
  }

  // Remove required array if empty
  if (schema.required!.length === 0) {
    delete schema.required
  }

  return schema
}

function convertVueTypeToJsonSchema(vueType: string, vueSchema: PropertyMetaSchema): any {
  // Unwrap enums for optionals/unions
  const { type: unwrappedType, schema: unwrappedSchema, enumValues } = unwrapEnumSchema(vueType, vueSchema)
  if (enumValues && unwrappedType === 'boolean') {
    return { type: 'boolean', enum: enumValues }
  }
  // Handle array with nested object schema FIRST to avoid union logic for array types
  if (unwrappedType.endsWith('[]')) {
    const itemType = unwrappedType.replace(/\[\]$/, '').trim()
    // If the schema is an object with kind: 'array' and schema is an array, use the first element as the item schema
    // Example: { kind: 'array', type: 'string[]', schema: [ 'string' ] }
    if (
      unwrappedSchema &&
      typeof unwrappedSchema === 'object' &&
      unwrappedSchema.kind === 'array' &&
      Array.isArray(unwrappedSchema.schema) &&
      unwrappedSchema.schema.length > 0
    ) {
      const itemSchema = unwrappedSchema.schema[0]
      return {
        type: 'array',
        items: convertVueTypeToJsonSchema(itemSchema.type || itemType, itemSchema)
      }
    }

    // If the schema is an object with only key '0', treat its value as the item type/schema
    // Example: { kind: 'array', type: 'string[]', schema: { '0': 'string' } }
    if (
      unwrappedSchema &&
      typeof unwrappedSchema === 'object' &&
      'schema' in unwrappedSchema &&
      (unwrappedSchema as any)['schema'] &&
      typeof (unwrappedSchema as any)['schema'] === 'object' &&
      !Array.isArray((unwrappedSchema as any)['schema']) &&
      Object.keys((unwrappedSchema as any)['schema']).length === 1 &&
      Object.keys((unwrappedSchema as any)['schema'])[0] === '0'
    ) {
      const itemSchema = (unwrappedSchema as any)['schema']['0']
      // If itemSchema is a string, treat as primitive
      if (typeof itemSchema === 'string') {
        return {
          type: 'array',
          items: convertSimpleType(itemSchema)
        }
      }
      // If itemSchema is an enum (for union types)
      if (itemSchema && typeof itemSchema === 'object' && itemSchema.kind === 'enum' && Array.isArray((itemSchema as any)['schema'])) {
        return {
          type: 'array',
          items: {
            type: (itemSchema as any)['schema'].map((t: any) => typeof t === 'string' ? t : t.type)
          }
        }
      }
      // Otherwise, recursively convert
      return {
        type: 'array',
        items: convertVueTypeToJsonSchema(itemType, itemSchema)
      }
    }
    // Fallback: treat as primitive
    return {
      type: 'array',
      items: convertSimpleType(itemType)
    }
  }

  // Handle object with nested schema
  if (
    unwrappedType.toLowerCase() === 'object' ||
    unwrappedType.match(/^{.*}$/) ||
    (unwrappedSchema && typeof unwrappedSchema === 'object' && unwrappedSchema.kind === 'object')
  ) {
    // Try to extract nested schema from various possible shapes
    let nested: Record<string, any> | undefined = undefined
    const vs: any = unwrappedSchema
    if (
      vs &&
      typeof vs === 'object' &&
      !Array.isArray(vs) &&
      Object.prototype.hasOwnProperty.call(vs, 'schema') &&
      vs['schema'] &&
      typeof vs['schema'] === 'object'
    ) {
      nested = vs['schema'] as Record<string, any>
    } else if (vs && typeof vs === 'object' && !Array.isArray(vs)) {
      nested = vs
    }
    if (nested) {
      const properties = convertNestedSchemaToJsonSchemaProperties(nested as Record<string, any>)
      // Collect required fields
      const required = Object.entries(nested)
        .filter(([_, v]) => v && typeof v === 'object' && v.required)
        .map(([k]) => k)
      const schemaObj: any = {
        type: 'object',
        properties,
        additionalProperties: false
      }
      if (required.length > 0) {
        schemaObj.required = required
      }
      return schemaObj
    }
    // Fallback to generic object
    return { type: 'object' }
  }
  // Handle simple types
  return convertSimpleType(unwrappedType)
}

function convertNestedSchemaToJsonSchemaProperties(nestedSchema: any): Record<string, any> {
  const properties: Record<string, any> = {}
  for (const key in nestedSchema) {
    const prop = nestedSchema[key]
    // Try to extract type and schema for each nested property
    let type = 'any', schema = undefined, description = '', def = undefined
    if (prop && typeof prop === 'object') {
      type = prop.type || 'any'
      schema = prop.schema || undefined
      description = prop.description || ''
      def = prop.default
    } else if (typeof prop === 'string') {
      type = prop
    }
    properties[key] = convertVueTypeToJsonSchema(type, schema)
    // Only add description if non-empty
    if (description) {
      properties[key].description = description
    }
    // Only add default if not the default value for the type, except for object with def = {}
    if (def !== undefined) {
      if (
        (type === 'object' && typeof def === 'object' && !Array.isArray(def) && Object.keys(def).length === 0) ||
        (!(type === 'string' && def === '') &&
        !(type === 'number' && def === 0) &&
        !(type === 'boolean' && def === false) &&
        !(type === 'array' && Array.isArray(def) && def.length === 0))
      ) {
        properties[key].default = def
      }
    }
  }
  return properties
}

function convertSimpleType(type: string): any {
  switch (type.toLowerCase()) {
    case 'string':
      return { type: 'string' }
    case 'number':
      return { type: 'number' }
    case 'boolean':
      return { type: 'boolean' }
    case 'object':
      return { type: 'object' }
    case 'array':
      return { type: 'array' }
    case 'null':
      return { type: 'null' }
    default:
      // For complex types, return object type as fallback
      if (type.includes('{}') || type.includes('Object')) {
        return { type: 'object' }
      }
      return {} // unknown types
  }
}

function parseDefaultValue(defaultValue: string): any {
  try {
    // Remove quotes if it's a string literal
    if (defaultValue.startsWith('"') && defaultValue.endsWith('"')) {
      return defaultValue.slice(1, -1)
    }

    // Handle boolean literals
    if (defaultValue === 'true') return true
    if (defaultValue === 'false') return false

    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(defaultValue)) {
      return parseFloat(defaultValue)
    }

    // Handle objects and arrays
    if (defaultValue.startsWith('{') || defaultValue.startsWith('[')) {
      return JSON.parse(defaultValue)
    }

    return defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Here are some examples of vueSchema:
 * 
 * ```
 * {
 *   kind: 'enum',
 *   type: 'string | undefined', // <-- vueType
 *   schema: { '0': 'undefined', '1': 'string' }
 * }
 * ```
 * ```
 * {
 *   kind: 'enum',
 *   type: '{ hello: string; } | undefined', // <-- vueType
 *   schema: {
 *     '0': 'undefined',
 *     '1': { kind: 'object', type: '{ hello: string; }', schema: [...] }
 *   }
 * }
 * ```
 * 
 * 
 */
function unwrapEnumSchema(vueType: string, vueSchema: PropertyMetaSchema): { type: string, schema: any, enumValues?: any[] } {
  // If schema is an enum with undefined, unwrap to the defined type
  if (
    typeof vueSchema === 'object' &&
    vueSchema?.kind === 'enum' &&
    vueSchema?.schema && typeof vueSchema?.schema === 'object'
  ) {
    // Collect all non-undefined values
    const values = Object.values(vueSchema.schema).filter(v => v !== 'undefined')
    // Special handling for boolean enums
    if (values.every(v => v === 'true' || v === 'false')) {
      // If both true and false, it's a boolean
      if (values.length === 2) {
        return { type: 'boolean', schema: undefined }
      } else if (values.length === 1) {
        // Only one value, still boolean but with enum
        return { type: 'boolean', schema: undefined, enumValues: [values[0] === 'true'] }
      }
    }
    // If only one non-undefined value, unwrap it
    if (values.length === 1) {
      const s = values[0]
      let t = vueType
      if (typeof s === 'object' && s.type) t = s.type
      else if (typeof s === 'string') t = s
      return { type: t, schema: s }
    }
    // Otherwise, fallback to first non-undefined
    for (const s of values) {
      if (s !== 'undefined') {
        let t = vueType
        if (typeof s === 'object' && s.type) t = s.type
        else if (typeof s === 'string') t = s
        return { type: t, schema: s }
      }
    }
  }

  return { type: vueType, schema: vueSchema }
}