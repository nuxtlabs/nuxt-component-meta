import type { ComponentMeta } from 'vue-component-meta'
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

function convertVueTypeToJsonSchema(vueType: string, vueSchema: any): any {
  // Handle 'any' type
  if (vueType === 'any') {
    return {} // JSON Schema allows any type when no type is specified
  }

  // Handle union types (e.g., "string | undefined" or "{ foo: string } | undefined")
  if (vueType.includes(' | ')) {
    const types = vueType.split(' | ').map(t => t.trim())
    // Remove undefined and null from the union
    const nonNullableTypes = types.filter(t => t !== 'undefined' && t !== 'null')

    if (nonNullableTypes.length === 1) {
      // If only one non-nullable type, use it directly
      // Special handling: if schema is an enum with numeric keys, extract the schema for the non-undefined type
      if (
        vueSchema &&
        vueSchema.kind === 'enum' &&
        (vueSchema as any).schema &&
        typeof (vueSchema as any).schema === 'object' &&
        Object.keys((vueSchema as any).schema).every(k => !isNaN(Number(k)))
      ) {
        // Find the schema for the non-undefined type
        const matching = Object.values((vueSchema as any).schema).find((s: any) => s.type === nonNullableTypes[0])
        if (matching) {
          return convertVueTypeToJsonSchema(nonNullableTypes[0], matching.schema[0] || matching.schema)
        }
      }
      return convertVueTypeToJsonSchema(nonNullableTypes[0], vueSchema)
    } else if (nonNullableTypes.length > 1) {
      // If multiple non-nullable types, use anyOf
      return {
        anyOf: nonNullableTypes.map(t => {
          if ((t.toLowerCase() === 'object' || t.match(/^{.*}$/))) {
            if (vueSchema && vueSchema.kind === 'enum' && (vueSchema as any).schema && typeof (vueSchema as any).schema === 'object') {
              const matching = Object.values((vueSchema as any).schema).find((s: any) => s.type === t)
              if (matching) {
                return convertVueTypeToJsonSchema(t, matching.schema as any)
              }
            }
          }
          return convertVueTypeToJsonSchema(t, vueSchema as any)
        })
      }
    }
  }

  // Handle object with nested schema
  if ((vueType.toLowerCase() === 'object' || vueType.match(/^{.*}$/))) {
    // Try to extract nested schema from various possible shapes
    let nested: Record<string, any> | undefined = undefined
    const vs: any = vueSchema
    if (
      vs &&
      typeof vs === 'object' &&
      !Array.isArray(vs) &&
      Object.prototype.hasOwnProperty.call(vs, 'schema') &&
// @ts-ignore
      vs['schema'] &&
      typeof vs['schema'] === 'object'
    ) {
// @ts-ignore
      nested = vs['schema'] as Record<string, any>
    } else if (vs && typeof vs === 'object' && !Array.isArray(vs)) {
      nested = vs
    }
    if (nested) {
      return {
        type: 'object',
        properties: convertNestedSchemaToJsonSchemaProperties(nested as Record<string, any>),
        additionalProperties: false
      }
    }
    // Fallback to generic object
    return { type: 'object' }
  }

  // Handle array with nested object schema
  if (vueType.endsWith('[]')) {
    if (typeof vueSchema === 'string') {
      return {
        type: 'array',
        items: convertSimpleType(vueSchema)
      }
    }
    const itemProperties = convertNestedSchemaToJsonSchemaProperties(vueSchema.schema)
    return {
      type: 'array',
      items: {
        type: 'object',
        properties: itemProperties,
        required: Object.keys(itemProperties),
        additionalProperties: false
      }
    }
  }

  // Handle simple types
  return convertSimpleType(vueType)
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
