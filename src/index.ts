import { addTemplate, defineNuxtModule, Nuxt } from '@nuxt/kit'
import { parse } from 'vue-docgen-api'
import { runtimeDir } from './dirs'
import template from './template'

export default defineNuxtModule({
  setup(_options, nuxt: Nuxt) {
    nuxt.options.alias['#component-meta'] = runtimeDir
    nuxt.hook('components:extend', async (components: any[]) => {
      const _components = await Promise.all(
        components.map(async (component: any) => {
          const data = await parse(component.filePath)
          return {
            name: component.pascalName,
            description: data.description,
            slots: data.slots,
            props: (data.props || []).map(prop => {
              return {
                name: prop.name,
                default: prop.defaultValue ? prop.defaultValue.value : undefined,
                type: prop.type ? prop.type.name.split('|') : [],
                required: prop.required,
                values: prop.values,
                description: prop.description
              }
            })
          }
        })
      )

      addTemplate({
        filename: 'component-meta',
        getContents: () => template(_components)
      })
    })
  }
})
