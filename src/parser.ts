import fsp from 'fs/promises'
import { performance } from 'perf_hooks'
import { existsSync } from 'fs'
import { dirname, join, relative } from 'pathe'
import { resolveModule } from '@nuxt/kit'
import { createComponentMetaCheckerByJsonConfig } from 'vue-component-meta'
import consola from 'consola'
import type { ModuleOptions } from './options'

export function useComponentMetaParser (
  {
    outputDir = join(process.cwd(), '.component-meta/'),
    rootDir = process.cwd(),
    components: _components = [],
    componentDirs = [],
    checkerOptions,
    exclude = [],
    transformers = [],
    debug = false,
    metaFields
  }: ModuleOptions
) {
  const logger = consola.withScope('nuxt-component-meta')

  const outputPath = join(outputDir, 'component-meta')

  const isExcluded = (component: any) => {
    return exclude.find((excludeRule) => {
      switch (typeof excludeRule) {
        case 'string':
          return component.filePath.includes(excludeRule)
        case 'object':
          return excludeRule instanceof RegExp ? excludeRule.test(component.filePath) : false
        case 'function':
          return excludeRule(component)
        default:
          return false
      }
    })
  }

  /**
   * Initialize component data object from components
   */
  const components = {
    ...(_components || []).reduce(
      (acc: any, component: any) => {
        // Locally support exclude as it seem broken from createComponentMetaCheckerByJsonConfig
        if (isExcluded(component)) { return acc }

        if (!component.filePath || !component.pascalName) { return acc }

        const filePath = resolveModule(component.filePath, { paths: [rootDir] })

        acc[component.pascalName] = {
          ...component,
          fullPath: filePath,
          filePath: relative(rootDir, filePath),
          meta: {
            props: [],
            slots: [],
            events: [],
            exposed: []
          }
        }

        return acc
      },
      {}
    )
  }

  const getStringifiedComponents = () => JSON.stringify(components, null, 2)

  const getVirtualModuleContent = () => `export default ${getStringifiedComponents()}`

  let checker: ReturnType<typeof createComponentMetaCheckerByJsonConfig>
  const refreshChecker = () => {
    checker = createComponentMetaCheckerByJsonConfig(
      rootDir,
      {
        extends: `${rootDir}/tsconfig.json`,
        skipLibCheck: true,
        include: [
          '**/*',
          ...componentDirs.map(dir => `${typeof dir === 'string' ? dir : (dir?.path || '')}/**/*`)
        ]
      },
      checkerOptions
    )
  }

  /**
   * Write the output file.
   */
  const updateOutput = async (content?: string) => {
    const path = outputPath + '.mjs'
    if (!existsSync(dirname(path))) { await fsp.mkdir(dirname(path), { recursive: true }) }
    if (existsSync(path)) { await fsp.unlink(path) }
    await fsp.writeFile(
      path,
      content || getVirtualModuleContent(),
      'utf-8'
    )
  }

  /**
   * Stub output file
   */
  const stubOutput = async () => {
    if (existsSync(outputPath + '.mjs')) { return }
    await updateOutput('export default {}')
  }

  /**
   * Fetch a component metas by its file name.
   */
  const fetchComponent = async (component: string | any) => {
    // Create the checker at the very last moment and silently fail if unavailable.
    if (!checker) {
      try {
        refreshChecker()
      } catch (e) {
        return
      }
    }

    const startTime = performance.now()
    try {
      if (typeof component === 'string') {
        if (components[component]) {
          component = components[component]
        } else {
          component = Object.entries(components).find(([, comp]: any) => (comp.fullPath === component))

          // No component found via string
          if (!component) { return }

          component = component[1]
        }
      }

      // Component is missing required values
      if (!component?.fullPath || !component?.pascalName) { return }

      // Read component code
      let code = await fsp.readFile(component.fullPath, 'utf-8')

      // Support transformers
      if (transformers && transformers.length > 0) {
        for (const transform of transformers) {
          const transformResult = transform(component, code)
          component = transformResult?.component || component
          code = transformResult?.code || code
        }
      }

      // Ensure file is updated
      checker.updateFile(component.fullPath, code)

      const { props, slots, events, exposed } = checker.getComponentMeta(component.fullPath)

      component.meta.slots = metaFields.slots ? slots : []
      component.meta.events = metaFields.events ? events : []
      component.meta.exposed = metaFields.exposed ? exposed : []
      component.meta.props = (metaFields.props ? props : [])
        .filter(prop => !prop.global)
        .sort((a, b) => {
          // sort required properties first
          if (!a.required && b.required) {
            return 1
          }
          if (a.required && !b.required) {
            return -1
          }
          // then ensure boolean properties are sorted last
          if (a.type === 'boolean' && b.type !== 'boolean') {
            return 1
          }
          if (a.type !== 'boolean' && b.type === 'boolean') {
            return -1
          }

          return 0
        })

      components[component.pascalName] = component
    } catch (e) {
      debug && logger.info(`Could not parse ${component?.pascalName || component?.filePath || 'a component'}!`)
    }
    const endTime = performance.now()
    if (debug === 2) { logger.success(`${component?.pascalName || component?.filePath || 'a component'} metas parsed in ${(endTime - startTime).toFixed(2)}ms`) }
  }

  /**
   * Fetch all components metas
   */
  const fetchComponents = async () => {
    const startTime = performance.now()
    await Promise.all(Object.values(components).map(fetchComponent))
    const endTime = performance.now()
    if (!debug || debug === 2) { logger.success(`Components metas parsed in ${(endTime - startTime).toFixed(2)}ms`) }
  }

  return {
    get checker () { return checker },
    get components () { return components },
    refreshChecker,
    stubOutput,
    outputPath,
    updateOutput,
    fetchComponent,
    fetchComponents,
    getStringifiedComponents,
    getVirtualModuleContent
  }
}

export type ComponentMetaParser = ReturnType<typeof useComponentMetaParser>
