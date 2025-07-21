import { describe, test, expect } from 'vitest'
import { getComponentMeta } from '../src/parser'
import { propsToJsonSchema } from '../src/utils/schema'

describe('ComponentMetaParser', () => {
  test('should be able to fetch component meta', async () => {
    const meta = getComponentMeta('playground/components/TestComponent.vue')

    expect(meta).toBeDefined()
    expect(meta.props).toBeDefined()

    const propsNames = meta.props.map(prop => prop.name)
    expect(propsNames).toContain('foo')
    expect(propsNames).toContain('hello')
    expect(propsNames).toContain('booleanProp')
    expect(propsNames).toContain('numberProp')
  })

  test('propsToJsonSchema should convert props to JSON Schema format', async () => {
    const meta = getComponentMeta('playground/components/TestComponent.vue')
    const jsonSchema = propsToJsonSchema(meta.props)
    expect(jsonSchema).toBeDefined()
    expect(jsonSchema.type).toBe('object')
    expect(jsonSchema.properties).toBeDefined()

    // Check that properties are correctly converted
    expect(jsonSchema.properties?.foo).toEqual({
      type: 'string',
      description: 'The foo property.',
      default: 'Hello'
    })

    expect(jsonSchema.properties?.booleanProp).toEqual({
      type: 'boolean',
      default: false
    })

    expect(jsonSchema.properties?.numberProp).toEqual({
      type: 'number',
      default: 1.3
    })

    expect(jsonSchema.properties?.data).toEqual({
      "type": "object",
      "properties": {
        "gello": {
          "type": "string"
        }
      },
      "additionalProperties": false,
      "default": {},
      "required": ["gello"]
    })

    expect(jsonSchema.properties?.array).toEqual({
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "age": {
            "type": "number"
          }
        },
        "required": [
          "name",
          "age"
        ],
        "additionalProperties": false
      },
      "default": []
    })

    expect(jsonSchema.properties?.stringArray).toEqual({
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": []
    })

    expect(jsonSchema.properties?.numberArray).toEqual({
      "type": "array",
      "items": {
        "type": "number"
      },
      "default": []
    })

    // Since no props are required, the required array should not exist
    expect(jsonSchema.required).toEqual(['name'])
  })

  test('TestD.vue', () => {
    const meta = getComponentMeta('playground/components/TestD.vue')
    const result = propsToJsonSchema(meta.props)

    expect(result.properties?.foo).toEqual({
      description: "FOOOOOO",
      "type": "array",
      "items": {
        "type": "string"
      }
    })

    expect(result.properties?.bar).toEqual({
      "type": "array",
      "items": {
        "type": [
          "string",
          "number"
        ]
      }
    })
  })
})
