import type { Component } from '@nuxt/schema'
import type { ComponentMeta } from 'vue-component-meta'

export type ComponentData = Component & { 
  meta: ComponentMeta
  fullPath?: string
}

export type NuxtComponentMeta = Record<string, ComponentData>

export interface TransformersHookData {
  meta: NuxtComponentMeta
  path: string
  source: string
}

export type ExtendHookData = ComponentMetaParserOptions

/**
 * @deprecated Use TransformersHookData instead
 */
export type HookData = TransformersHookData