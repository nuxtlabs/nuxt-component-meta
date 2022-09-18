import { defineEventHandler, createError, appendHeader } from 'h3'
import { pascalCase } from 'scule'
// @ts-expect-error - Not resolve from tsconfig
import components from '#nuxt-component-meta/nitro'

export default defineEventHandler((event) => {
  // TODO: Replace via downstream config
  appendHeader(event, 'Access-Control-Allow-Origin', '*')

  const componentName = event.context.params['component?']

  if (componentName) {
    const meta = components[pascalCase(componentName)]
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

  return components
})
