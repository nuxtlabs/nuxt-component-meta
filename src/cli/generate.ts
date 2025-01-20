import { writeFile, copyFile, rm } from 'node:fs/promises'
import { defineCommand } from 'citty'
import { join, relative, resolve } from 'pathe'
import pkg from '../../package.json' assert { type: 'json' }
import { loadKit } from './utils/kit'
import { clearBuildDir } from './utils/fs'
import { importModule } from './utils/esm';

const privateKeys = new Set([
  'fullPath',
  'shortPath',
  'filePath',
  'declarations'
])

function filterKeys (key: string, value: unknown) {
  if (privateKeys.has(key)) {
    return undefined
  }

  return value
}

export const generate = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: 'Extract component meta from layers'
  },
  args: {
    rootDir: {
      type: 'positional',
      description: 'Root Directory'
    },
    outputDir: {
      type: 'string',
      description: 'Output Directory',
      default: '.component-meta'
    },
    schema: {
      type: 'boolean',
      description: 'Remove schema from output',
      default: true
    }
  },
  async setup ({ args }) {
    const cwd = resolve(args.rootDir || '.')
    const outputDir = join(cwd, args.outputDir || '.component-meta')
    const buildDir = join(outputDir, '.nuxt')
    const nitroDir = join(outputDir, '.output')

    const inputSource = join(buildDir, './component-meta.mjs')
    const inputTypes = join(buildDir, './component-meta.d.ts')

    const outputEsm = join(outputDir, './component-meta.mjs')
    const outputCjs = join(outputDir, './component-meta.cjs')
    const outputTypes = join(outputDir, './component-meta.d.ts')

    // todo: disabling schema generation is not working in vue-component-meta
    if (!args.schema) {
      privateKeys.add('schema')
    }

    const { loadNuxt, buildNuxt, installModule, logger } = await loadKit(
      cwd
    )

    const nuxt = await loadNuxt({
      rootDir: cwd,
      defaultConfig: {
        modules: [
          async (options, nuxt) => {
            const moduleInstalled = nuxt.options?._installedModules?.some(m => m.meta?.name === pkg.name)
            if (moduleInstalled) {
              logger.info(`Module "${pkg.name}" already installed`)
              return
            }

            const module = await import('../module').then(m => m.default)

            installModule(module, {
              debug: 2,
              exclude: ['node_modules']
            })
          }
        ]
      },
      overrides: {
        logLevel: 'silent',
        buildDir,
        nitro: {
          output: {
            dir: nitroDir
          }
        }
      }
    })
    await clearBuildDir(outputDir)
    await buildNuxt(nuxt)

    const components = await importModule(inputSource).then((m: any) => m.default || m)

    await Promise.all([
      copyFile(inputTypes, outputTypes),
      writeFile(
        outputEsm,
        `export default ${JSON.stringify(components, filterKeys, 2)}`
      ),
      writeFile(
        outputCjs,
        `module.exports = ${JSON.stringify(components, filterKeys, 2)}`
      )
    ])

    await Promise.all([
      rm(buildDir, { recursive: true, force: true }),
      rm(nitroDir, { recursive: true, force: true })
    ])

    logger.success(
      'Types generated in',
      relative(process.cwd(), outputDir)
    )
  }
})
