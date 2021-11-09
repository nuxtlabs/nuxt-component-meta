import { addTemplate, defineNuxtModule } from '@nuxt/kit'
import { parse } from 'vue-docgen-api'
import type { Nuxt } from '@nuxt/kit'
import { runtimeDir } from './dirs'
import template from './template'

export default defineNuxtModule({
  setup(_options, nuxt: Nuxt) {
    nuxt.options.alias['#component-meta'] = runtimeDir
    nuxt.hook('components:extend', async (components: any[]) => {
      const _components = await Promise.all(
        components.map(async (component: any) => {
          let data
          try {
            data = await parse(component.filePath)
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`Cannot parse "${component.pascalName}".`, e)
            data = {}
          }
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
        filename: 'component-meta.mjs',
        getContents: () => template(_components)
      })
    })
  }
})
