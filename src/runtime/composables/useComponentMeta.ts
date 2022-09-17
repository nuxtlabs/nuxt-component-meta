import { reactive } from 'vue'
import type { Component } from '@nuxt/schema'
// @ts-ignore
import { useNuxtApp } from '#imports'
// @ts-ignore
import __componentMeta from '#nuxt-component-meta'

type ComponentMeta = {
  meta: any
}

interface ComponentMetas {
  [key: string]: ComponentMeta & Component & { [key: string]: any}
}

// Workaround for vite HMR with virtual modules
export const _getComponentMeta = () => __componentMeta as ComponentMetas

export function useComponentMeta (): ComponentMetas {
  const nuxtApp = useNuxtApp()
  if (!nuxtApp._componentMeta) {
    nuxtApp._componentMeta = reactive(__componentMeta) as ComponentMetas
  }
  return nuxtApp._componentMeta
}

// HMR Support
if (process.dev) {
  function applyHMR (newConfig: ComponentMeta) {
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
    import.meta.hot.on('component-meta:update', data => applyHMR(data))
  }
}
