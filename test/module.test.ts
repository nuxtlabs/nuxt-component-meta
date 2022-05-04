import { fileURLToPath } from 'url'
import { test, describe, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('fixtures:basic', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    server: true
  })

  test('List components', async () => {
    const components = await $fetch('/api/component-meta')
    expect(components.length).greaterThan(0)

    components.forEach((component) => {
      expect(component).ownProperty('name')
      expect(component).ownProperty('props')
      expect(Array.isArray(component.props)).toBeTruthy()
      expect(component).ownProperty('slots')
      expect(Array.isArray(component.slots)).toBeTruthy()
    })

    const testComponent = components.find(c => c.name === 'TestComponent')
    expect(testComponent.props).toMatchObject([{
      name: 'hello'
    }])
  })

  test('Single components', async () => {
    const component = await $fetch('/api/component-meta/test-component')

    expect(component).ownProperty('name')
    expect(component).ownProperty('props')
    expect(Array.isArray(component.props)).toBeTruthy()
    expect(component).ownProperty('slots')
    expect(Array.isArray(component.slots)).toBeTruthy()

    expect(component.props).toMatchObject([{
      name: 'hello'
    }])
  })
})
