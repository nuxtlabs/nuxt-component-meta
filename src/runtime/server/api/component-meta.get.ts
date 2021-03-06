import { defineEventHandler, createError, appendHeader } from 'h3'
import { pascalCase } from 'scule'
import { components } from '#meta/virtual/meta'

export default defineEventHandler((event) => {
  // TODO: Replace via downstream config
  appendHeader(event, 'Access-Control-Allow-Origin', '*')

  const componentName = event.context.params['component?']

  if (componentName) {
    const meta = components.find(c => c.name === pascalCase(componentName))
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
