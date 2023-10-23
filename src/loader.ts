import {
  resolveAlias,
  createResolver,
  logger
} from '@nuxt/kit'
import type { ComponentData } from './types'

// Resolve external components definitions
export async function loadExternalSources (sources: Array<Record<string, ComponentData> | string> = []) {
  const resolver = createResolver(import.meta.url)

  const components: Record<string, ComponentData> = {}
  for (const src of sources) {
    if (typeof src === 'string') {
      try {
        let modulePath = ''
        const alias = resolveAlias(src)
        if (alias !== src) {
          modulePath = alias
        } else {
          modulePath = await resolver.resolvePath(src)
        }

        // try to load default export
        const definition: Record<string, ComponentData> = await import(modulePath).then(m => m.default || m)
        for (const [name, meta] of Object.entries(definition)) {
          components[name] = meta
        }
      } catch (error) {
        logger.error(`Unable to load static components definitions from "${src}"`, error)
      }
    } else {
      for (const [name, meta] of Object.entries(src)) {
        components[name] = meta
      }
    }
  }

  return components
}
