import { reactive } from 'vue'
// @ts-ignore
import { NuxtComponentMeta } from '../../types'
import { useNuxtApp } from '#imports'
import __componentMeta from '#nuxt-component-meta'
import type { NuxtComponentMetaNames } from '#nuxt-component-meta/types'

// Workaround for vite HMR with virtual modules
export const _getComponentMeta = () => __componentMeta as NuxtComponentMeta

export function useComponentMeta (name: NuxtComponentMetaNames): NuxtComponentMeta {
  const nuxtApp = useNuxtApp()

  if (!nuxtApp._componentMeta) {
    nuxtApp._componentMeta = reactive(__componentMeta) as NuxtComponentMeta
  }

  if (name) {
    return computed(() => nuxtApp._componentMeta[name])
  }

  return nuxtApp._componentMeta
}

// HMR Support
if (process.dev) {
  function applyHMR (newConfig: NuxtComponentMeta) {
    const componentMetas = useComponentMeta()
    if (newConfig && componentMetas) {
      for (const key in newConfig) {
        (componentMetas as any)[key] = (newConfig as any)[key]
      }
      for (const key in componentMetas) {
        if (!(key in newConfig)) {
          delete (componentMetas as any)[key]
        }
      }
    }
  }

  // Vite
  if (import.meta.hot) {
    // Vite
    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        const newMetas = newModule._getComponentMeta()
        applyHMR(newMetas)
      })
    }
  }
}
