import fsp from 'fs/promises'
import { fileURLToPath } from 'url'
import { test, describe, expect } from 'vitest'
import { ComponentProp, ComponentPropType } from '../src/types'
import { parseComponent } from '../src/utils/parseComponent'

describe('Basic Component', async () => {
  const path = fileURLToPath(new URL('./fixtures/basic/components/NormalScript.vue', import.meta.url))
  const source = await fsp.readFile(path, { encoding: 'utf-8' })
  // Parse component source
  const { props, slots } = parseComponent('NormalScript', source)

  test('slots', () => {
    expect(slots).toEqual([])
  })

  test('props', () => {
    expect(props).toBeDefined()
    expect(props.length > 0)
  })

  test('props:src', () => {
    const prop = props.find(prop => prop.name === 'src') as ComponentProp
    expect(prop).toBeDefined()
    expect((prop.type as ComponentPropType)?.type).toEqual(['String', 'Object'])
    expect((prop.type as ComponentPropType)?.as).toEqual('NuxtImg')
    expect(prop.default).toEqual(undefined)
  })

  test('props:alt', () => {
    const prop = props.find(prop => prop.name === 'alt') as ComponentProp
    expect(prop).toBeDefined()
    expect(prop.type).toEqual('String')
    expect(prop.default).toEqual('')
  })

  test('props:width', () => {
    const prop = props.find(prop => prop.name === 'width') as ComponentProp
    expect(prop).toBeDefined()
    expect(prop.type).toEqual(['String', 'Number'])
    expect(prop.default).toEqual(undefined)
  })

  test('props:height', () => {
    const prop = props.find(prop => prop.name === 'height') as ComponentProp
    expect(prop).toBeDefined()
    expect(prop.type).toEqual(['String', 'Number'])
    expect(prop.default).toEqual(undefined)
  })
})
