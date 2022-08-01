import type { ComponentMeta } from 'vue-component-meta'

export type NuxtComponentMeta = ComponentMeta & { name: string, global?: boolean }

export interface HookData {
  meta: NuxtComponentMeta
  path: string
  source: string
}
