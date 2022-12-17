import {
  resolveModule,
} from '@nuxt/kit'
import { join } from 'pathe'
import fsp from 'fs/promises'
import { createComponentMetaCheckerByJsonConfig } from 'vue-component-meta'
import { performance } from 'perf_hooks'
import type { ModuleOptions } from './options'
import consola from 'consola'

export function useComponentMetaParser(
  {
    outputDir = join(process.cwd(), '.component-meta/'),
    rootDir = process.cwd(),
    components: _components = [],
    componentDirs = [],
    checkerOptions,
    exclude = [],
    transformers = [],
    debug = false
  }: ModuleOptions
) {
  const logger = consola.withScope('nuxt-component-meta')

  const outputPath = join(outputDir, 'component-meta')

  /**
   * Initialize component data object from components
   */
  const components = {
    ...(_components || []).reduce(
      (acc: any, component: any) => {
        // Locally support exclude as it seem broken from createComponentMetaCheckerByJsonConfig
        if (exclude.find((excludePath) => component.filePath.includes(excludePath))) { return acc }

        if (!component.filePath || !component.pascalName) { return acc }

        const filePath = resolveModule(component.filePath, { paths: [rootDir] })

        acc[component.pascalName] = {
          ...component,
          fullPath: filePath,
          filePath: filePath.replace(rootDir, ''),
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

  const getComponents = () => components

  const getStringifiedComponents = () => JSON.stringify(getComponents(), null, 2)

  const getVirtualModuleContent = () => `export default ${getStringifiedComponents()}`

  const checker = createComponentMetaCheckerByJsonConfig(
    rootDir,
    {
      extends: `${rootDir}/tsconfig.json`,
      skipLibCheck: true,
      include: [
        '**/*',
        ...componentDirs.map(dir => `${typeof dir === 'string' ? dir : (dir?.path || '')}/**/*`)
      ],
      exclude
    },
    checkerOptions
  )

  /**
   * Output is needed for Nitro
   */
  const updateOutput = async () => {
    // Main export of component data
    await fsp.writeFile(
      outputPath + '.mjs',
      getVirtualModuleContent(),
      'utf-8'
    )
  }

  const fetchComponent = async (component: string | any) => {
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

      component.meta.slots = slots
      component.meta.events = events
      component.meta.exposed = exposed
      component.meta.props = props
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
      // eslint-disable-next-line no-console
      !debug && logger.info(`Could not parse ${component?.pascalName || component?.filePath || 'a component'}!`)
    }
    const endTime = performance.now()
    if (debug === 2) logger.success(`${component?.pascalName || component?.filePath || 'a component'} metas parsed in ${(endTime - startTime).toFixed(2)}ms`)
  }

  const fetchComponents = async () => {
    const startTime = performance.now()
    await Promise.all(Object.values(components).map(fetchComponent))
    const endTime = performance.now()
    if (!debug) logger.success(`Components metas parsed in ${(endTime - startTime).toFixed(2)}ms`)
  }

  return {
    checker,
    outputPath,
    updateOutput,
    fetchComponent,
    fetchComponents,
    getComponents,
    components,
    getStringifiedComponents,
    getVirtualModuleContent
  }
}

export type ComponentMetaParser = ReturnType<typeof useComponentMetaParser>
