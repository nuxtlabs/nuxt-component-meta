import { MetaCheckerOptions } from 'vue-component-meta'
import { ComponentsDir, ComponentsOptions } from '@nuxt/schema'
import { HookData } from './types'

export interface ModuleOptions {
  outputDir?: string
  rootDir?: string
  silent?: boolean
  componentDirs: (string | ComponentsDir)[]
  components?: ComponentsOptions[]
  checkerOptions?: MetaCheckerOptions
  transformers?: ((component: any, code: string) => ({ component: any; code: string }))[]
}

export interface ModuleHooks {
  'component-meta:transformers'(data: HookData): void
}
