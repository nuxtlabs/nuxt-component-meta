import {
  resolveAlias,
  createResolver,
  logger
} from '@nuxt/kit'
import type { NuxtComponentMeta } from './types'

// Resolve external components definitions
export async function loadExternalSources (sources: (string | Partial<NuxtComponentMeta>)[] = []) {
  const resolver = createResolver(import.meta.url)

  const components: NuxtComponentMeta = {}
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
        const definition: NuxtComponentMeta = await import(modulePath).then(m => m.default || m)
        for (const [name, meta] of Object.entries(definition)) {
          components[name] = meta
        }
      } catch (error) {
        logger.error(`Unable to load static components definitions from "${src}"`, error)
      }
    } else {
      for (const [name, meta] of Object.entries(src)) {
        if (meta) {
          components[name] = meta
        }
      }
    }
  }

  return components
}
