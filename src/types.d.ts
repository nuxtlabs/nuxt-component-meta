import type { Component } from '@nuxt/schema'
import type { ComponentMeta } from 'vue-component-meta'

export type ComponentData = Component & { meta: ComponentMeta}

export type NuxtComponentMeta = Record<string, ComponentData>

export interface HookData {
  meta: NuxtComponentMeta
  path: string
  source: string
}
