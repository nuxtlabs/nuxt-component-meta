import type { Component } from '@nuxt/schema'
import type { ComponentMeta } from 'vue-component-meta'

export type NuxtComponentMeta = ComponentMeta & Component

export interface HookData {
  meta: NuxtComponentMeta
  path: string
  source: string
}
