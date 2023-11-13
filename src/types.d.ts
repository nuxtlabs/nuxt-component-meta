import type { Component } from '@nuxt/schema'
import type { ComponentMeta } from 'vue-component-meta'
import type { ComponentMetaParserOptions } from './parser'

export type ComponentData = Omit<Component, 'filePath' | 'shortPath'> & { 
  meta: ComponentMeta
  fullPath?: string
  filePath?: string,
  shortPath?: string,
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