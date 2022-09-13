import { resolve } from 'path'

export const parseComponentMetas = (component: any, checker: any, options: any) => {
  const path = resolve(
    options.rootDir,
    component.filePath
  )

  const data = {
    meta: {
      name: component.pascalName,
      global: Boolean(component.global),
      props: [],
      slots: [],
      events: [],
      exposed: []
    },
    path,
    source: ''
  }

  if (!checker) {
    return data.meta
  }

  try {
    const { props, slots, events, exposed } = checker?.getComponentMeta(path)

    data.meta.slots = slots
    data.meta.events = events
    data.meta.exposed = exposed
    data.meta.props = props
      .filter(prop => !prop.global)
      .sort((a, b) => {
        // sort required properties first
        if (!a.required && b.required) {
          return 1
        }
        if (a.required && !b.required) {
          return -1
        }
        // then ensure boolean properties are sorted last
        if (a.type === 'boolean' && b.type !== 'boolean') {
          return 1
        }
        if (a.type !== 'boolean' && b.type === 'boolean') {
          return -1
        }

        return 0
      })

    console.log({ data })
  } catch (error: any) {
    console.error(`Unable to parse component "${path}": ${error}`)
  }

  return data.meta
}
