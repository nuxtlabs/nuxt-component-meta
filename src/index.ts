import { addTemplate, defineNuxtModule, Nuxt } from '@nuxt/kit'
import { parse } from 'vue-docgen-api'
import { runtimeDir } from './dirs'

export default defineNuxtModule({
  setup(_options, nuxt: Nuxt) {
    nuxt.options.alias['#component-meta'] = runtimeDir
    nuxt.hook('components:extend', async (components: any[]) => {
      const _components = await Promise.all(
        components.map(async (component: any) => {
          const data = await parse(component.filePath)
          return {
            name: component.pascalName,
            props: (data.props || []).map(prop => {
              return {
                key: prop.name,
                default: prop.defaultValue ? prop.defaultValue.value : undefined,
                type: prop.type ? prop.type.name : undefined
              }
            })
          }
        })
      )

      addTemplate({
        filename: 'component-meta',
        getContents() {
          return `import { pascalCase } from 'scule'

export const components = ${JSON.stringify(_components)}
export const getComponent = name => {
  name = pascalCase(name)
  return components.find(c => c.name === name)
}`
        }
      })
    })
  }
})
