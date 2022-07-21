import fsp from 'fs/promises'
import { fileURLToPath } from 'url'
import { test, describe, expect } from 'vitest'
import { ComponentPropType } from '../src/types'
import { parseComponent } from '../src/utils/parseComponent'

describe('Basic Component', async () => {
  const path = fileURLToPath(new URL('./fixtures/basic/components/BasicComponent.vue', import.meta.url))
  const source = await fsp.readFile(path, { encoding: 'utf-8' })
  // Parse component source
  const { props, slots } = parseComponent('BasicComponent', source)

  test('Slots', () => {
    expect(slots).toEqual([
      { name: 'default' },
      { name: 'nuxt' },
      { name: 'variable' },
      { name: 'foo-bar' }
    ])
  })

  test('Props', () => {
    expect(props).toBeDefined()
    expect(props.length > 0)
  })

  test('String', () => {
    const stringProps = props.filter(p => p.type === 'String')

    expect(stringProps.length).toBe(1)
    expect(stringProps[0].name).toBe('stringProp')
    expect(stringProps[0].default).toBe('Hello')
  })

  test('Boolean', () => {
    const booleanProps = props.filter(p => p.type === 'Boolean')

    expect(booleanProps.length).toBe(1)
    expect(booleanProps[0].name).toBe('booleanProp')
    expect(booleanProps[0].default).toBe(false)
  })

  test('Number', () => {
    const numberProps = props.filter(p => p.type === 'Number')

    expect(numberProps.length).toBe(1)
    expect(numberProps[0].name).toBe('numberProp')
    expect(numberProps[0].default).toBe(1.3)
  })

  test('Array', () => {
    const arrayProps = props.filter(p => p.type === 'Array')

    expect(arrayProps.length).toBe(1)
    expect(arrayProps[0].name).toBe('arrayProp')

    const typedArrayProps = props.filter(p => (p.type as ComponentPropType)?.type === 'Array')

    expect(typedArrayProps.length).toBe(1)
    expect(typedArrayProps[0].name).toBe('typedArrayProps')
    expect(((typedArrayProps[0].type as ComponentPropType)?.as as ComponentPropType)?.type).toBe('Array')
    expect(((typedArrayProps[0].type as ComponentPropType)?.as as ComponentPropType)?.elementType).toBe('String')
  })

  test('Object', () => {
    const objectProps = props.filter(p => p.type === 'Object')

    expect(objectProps.length).toBe(1)
    expect(objectProps[0].name).toBe('objectProp')
  })
})
