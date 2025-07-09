import { createCheckerByJson } from "vue-component-meta"
import type { ComponentMeta } from 'vue-component-meta'
import { refineMeta } from "./utils"
import { join } from "pathe"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

export interface Options {
  rootDir: string
  cache?: boolean
  cacheDir?: string
}

export function getComponentMeta(component: string, options?: Options): ComponentMeta {
  const rootDir = options?.rootDir ?? process.cwd()
  const opts = {
    cache: false,
    rootDir,
    cacheDir: join(rootDir, ".data/cache"),
    ...options
  }
  const fullPath = join(opts.rootDir, component)
  const cachePath = join(opts.cacheDir, `${component}.json`)

  if (opts.cache && existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, { encoding: 'utf8', flag: 'r' })) as ComponentMeta
  }

  const checker = createCheckerByJson(
    opts.rootDir,
    {
      extends: `${opts.rootDir}/tsconfig.json`,
      skipLibCheck: true,
      include: [fullPath],
      exclude: []
    },
  )

  const meta = checker.getComponentMeta(component)
  const refinedMeta = refineMeta(meta)

  if (opts.cache) {
    const cache = JSON.stringify(refinedMeta, null, 2)
    if (!existsSync(opts.cacheDir)) {
      mkdirSync(opts.cacheDir, { recursive: true })
    }
    writeFileSync(cachePath, cache, { encoding: 'utf8', flag: 'w' })
  }

  return refinedMeta
}
