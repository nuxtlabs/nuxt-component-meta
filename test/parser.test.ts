import { describe, test, expect } from 'vitest'
import { getComponentMeta } from '../src/parser'
import { propsToJsonSchema } from '../src/utils'
import { jsonSchemaToZod } from 'json-schema-to-zod'

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

  test('whole', async () => {
    const meta = getComponentMeta('playground/components/TestComponent.vue')
    const jsonSchema = propsToJsonSchema(meta.props)
    const zod = jsonSchemaToZod(jsonSchema, { module: "cjs" })

    const data = [
      {
        match: true,
        data: {
          name: 'nuxt-component-meta',
          foo: 'bar',
          hello: 'world',
          booleanProp: true,
          numberProp: 42,
          data: {
            gello: "Gello"
          }
        }
      },
      {
        match: false,
        data: {
          name: 'nuxt-component-meta',
          foo: 12,
          hello: 'world',
          booleanProp: true,
          numberProp: 42,
          data: {
            gello: "Gello"
          }
        }
      }
    ]

    for (const item of data) {
      const schema = eval(zod)
      if (item.match) {
        schema.parse(item.data)
      } else {
        expect(() => schema.parse(data)).toThrow()
      }
    }
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
      "default": {}
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
})
