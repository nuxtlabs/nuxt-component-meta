import { reactive, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
// @ts-ignore
import { ComponentData, NuxtComponentMeta } from '../../types'
import { useNuxtApp, useFetch } from '#imports'
import type { NuxtComponentMetaNames } from '#nuxt-component-meta/types'

// @ts-ignore
export const __getComponentMeta = async () => {
  const __metas = await import('#nuxt-component-meta')
  return __metas?.default || __metas
}

export async function useComponentMeta <T> (componentName?: NuxtComponentMetaNames | Ref<NuxtComponentMetaNames>): Promise<ComputedRef<T extends string ? ComponentData : NuxtComponentMeta>> {
  const nuxtApp = useNuxtApp()

  const _componentName = unref(componentName)

  // @ts-ignore
  if (process.dev) {
    // Development ; use #nuxt-component-meta virtual module
    const __componentMeta = await __getComponentMeta()

    if (!nuxtApp._componentMeta) {
      nuxtApp._componentMeta = reactive(__componentMeta) as NuxtComponentMeta
    }

    if (_componentName) {
      return computed(() => nuxtApp._componentMeta[_componentName])
    }

    return computed(() => nuxtApp._componentMeta)
  } else {
    // Production ; use API to fetch metas
    const { data } = await useAsyncData(
      `nuxt-component-meta${_componentName ? `-${_componentName}` : ''}`,
      () => {
        return $fetch(`/api/component-meta${_componentName ? `/${_componentName}` : ''}`)
      }
    )

    return computed<any>(() => data.value)
  }
}

// HMR Support
if (process.dev) {
  async function applyHMR (newConfig: NuxtComponentMeta) {
    const componentMetas = await useComponentMeta()
    if (newConfig && componentMetas.value) {
      for (const key in newConfig) {
        (componentMetas.value as any)[key] = (newConfig as any)[key]
      }
      for (const key in componentMetas.value) {
        if (!(key in newConfig)) {
          delete (componentMetas.value as any)[key]
        }
      }
    }
  }

  // Vite
  if (import.meta.hot) {
    import.meta.hot.accept(async (newModule) => {
      const newMetas = await newModule.__getComponentMeta()

      applyHMR(newMetas)
    })
  }
}
