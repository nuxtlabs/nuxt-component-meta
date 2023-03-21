import { MetaCheckerOptions } from 'vue-component-meta'
import { ComponentsDir, ComponentsOptions } from '@nuxt/schema'
import { HookData } from './types'

export interface ModuleOptions {
  outputDir?: string
  rootDir?: string
  debug?: boolean | 2
  componentDirs: (string | ComponentsDir)[]
  components?: ComponentsOptions[]
  exclude?: (string | RegExp | ((component: any) => boolean))[]
  checkerOptions?: MetaCheckerOptions
  transformers?: ((component: any, code: string) => ({ component: any; code: string }))[]
  globalsOnly?: boolean
}

export interface ModuleHooks {
  'component-meta:transformers'(data: HookData): void
}
