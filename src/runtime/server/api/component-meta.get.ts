import { defineEventHandler, createError } from 'h3'
import { pascalCase } from 'scule'
import { useRuntimeConfig } from '#nitro'

export default defineEventHandler((event) => {
  const componentName = event.context.params.component
  const componentMeta = useRuntimeConfig().componentMeta || []
  if (componentName) {
    const meta = componentMeta.find(c => c.name === pascalCase(componentName))
    if (!meta) {
      throw createError({
        statusMessage: 'Components not found!',
        statusCode: 404,
        data: {
          description: 'Please make sure you are looking for correct component'
        }
      })
    }

    return meta
  }

  return componentMeta
})
