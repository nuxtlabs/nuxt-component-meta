import { addTemplate, defineNuxtModule, resolveModule } from '@nuxt/kit'
import { parse } from 'vue-docgen-api'
import type { Nuxt } from '@nuxt/kit'
import { runtimeDir } from './dirs'
import template from './template'

export interface Options {
  parserOptions?: Parameters<typeof parse>[1]
}

export default defineNuxtModule<Options>({
  configKey: 'componentMeta',
  setup({ parserOptions }, nuxt: Nuxt) {
    nuxt.options.alias['#component-meta'] = runtimeDir
    nuxt.hook('components:extend', async (components: any[]) => {
      const _components = await Promise.all(
        components.map(async (component: any) => {
          let data
          try {
            // resolve component path, auto detect extension if not specified
            const path = resolveModule(component.filePath, { paths: nuxt.options.rootDir })
            data = await parse(path, parserOptions)
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
