import fsp from 'fs/promises'
import { createUnplugin } from 'unplugin'
import { createComponentMetaCheckerByJsonConfig } from 'vue-component-meta'
import { resolveModule } from '@nuxt/kit'
import { join } from 'pathe'
import { ModuleOptions } from './options'

export const metaPlugin = createUnplugin<Required<ModuleOptions>>(
  (options) => {
    const outputPath = join(options.outputDir, 'component-meta')

    /**
     * Initialize component data object from components
     */
    const components = {
      ...(options?.components || []).reduce(
        (acc: any, component: any) => {
          if (!component.filePath || !component.pascalName) { return acc }

          const filePath = resolveModule(component.filePath, { paths: [options.rootDir] })

          acc[component.pascalName] = {
            ...component,
            fullPath: filePath,
            filePath: filePath.replace(options.rootDir, ''),
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
      options.rootDir,
      {
        extends: `${options?.rootDir}/tsconfig.json`,
        skipLibCheck: false,
        include: [
          '**/*',
          ...options?.componentDirs.map(dir => `${typeof dir === 'string' ? dir : (dir?.path || '')}/**/*`)
        ],
        exclude: []
      },
      options.checkerOptions
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
        if (options?.transformers && options.transformers.length > 0) {
          for (const transform of options.transformers) {
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
        !options?.silent && console.log(`Could not parse ${component?.pascalName || component?.filePath || 'a component'}!`)
      }
    }

    const fetchComponents = () => Promise.all(Object.values(components).map(fetchComponent))

    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      async buildStart () {
        await fetchComponents()
        await updateOutput()
      },
      vite: {
        async handleHotUpdate ({ file }) {
          if (Object.entries(components).some(([, comp]: any) => comp.fullPath === file)) {
            await fetchComponent(file)
            await updateOutput()
          }
        }
      }
    }
  })
