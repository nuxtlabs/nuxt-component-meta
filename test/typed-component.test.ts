import fsp from 'fs/promises'
import { fileURLToPath } from 'url'
import { test, describe, expect } from 'vitest'
import { ComponentPropType } from '../src/types'
import { parseComponent } from '../src/utils/parseComponent'

describe('Basic Component', async () => {
  const path = fileURLToPath(new URL('./fixtures/basic/components/TestTypedComponent.vue', import.meta.url))
  const source = await fsp.readFile(path, { encoding: 'utf-8' })
  // Parse component source
  const { props, slots } = parseComponent('TestTypedComponent', source)

  test('Slots', () => {
    expect(slots).toEqual([
      { name: 'default' },
      { name: 'nuxt' }
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
    expect(stringProps[0].required).toBe(true)
  })

  test('Boolean', () => {
    const booleanProps = props.filter(p => p.type === 'Boolean')

    expect(booleanProps.length).toBe(1)
    expect(booleanProps[0].name).toBe('booleanProp')
    expect(booleanProps[0].required).toBe(false)
  })

  test('Number', () => {
    const numberProps = props.filter(p => p.type === 'Number')

    expect(numberProps.length).toBe(1)
    expect(numberProps[0].name).toBe('numberProp')
    expect(numberProps[0].required).toBe(false)
  })

  test('Array', () => {
    const arrayProps = props.filter(p => p.type === 'Array' || (p.type as ComponentPropType)?.type === 'Array')

    expect(arrayProps.length).toBe(1)
    expect(arrayProps[0].name).toBe('arrayProp')
    expect(arrayProps[0].required).toBe(false)
  })

  test('Custom type', () => {
    const objectProps = props.filter(p => p.type === 'TestObject')

    expect(objectProps.length).toBe(1)
    expect(objectProps[0].name).toBe('objectProp')
    expect(objectProps[0].required).toBe(false)
  })
})
