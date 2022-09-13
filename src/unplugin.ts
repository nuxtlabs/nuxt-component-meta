
import { writeFileSync } from 'fs'
import { checkServerIdentity } from 'tls'
import { defu } from 'defu'
import { createUnplugin } from 'unplugin'
import { createComponentMetaCheckerByJsonConfig } from 'vue-component-meta'
import { resolveModule } from '@nuxt/kit'
import type { ViteDevServer } from 'vite'
import { join } from 'pathe'

export const defaultOptions = {
}

interface ComponentReferences {
}

export default createUnplugin<any>(
  (options) => {
    options = defu(options, defaultOptions)

    let server: ViteDevServer

    /**
     * Initialize component data object from components
     */
    const components = {
      ...(options?.components || []).reduce(
        (acc, component) => {
          if (!component.filePath || !component.pascalName) { return acc }

          const fullPath = resolveModule(component.filePath, { paths: [options.rootDir] })

          acc[component.pascalName] = {
            ...component,
            fullPath,
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

    let checker
    const refreshChecker = () => {
      if (checker?.__internal__?.tsLs) {
        checker.__internal__.tsLs.dispose()
      }
      checker = createComponentMetaCheckerByJsonConfig(
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
    }
    refreshChecker()

    /**
     * Output is needed for Nitro
     */
    const updateOutput = () => {
      console.log('write!', { components: components.TestComponent.meta.props })
      writeFileSync(
        join(options.outputDir, 'components-meta.mjs'),
        `export const components = ${JSON.stringify(components, null, 2)}`,
        'utf-8'
      )
    }

    const fetchComponent = (component: string | any) => {
      try {
        if (typeof component === 'string') {
          if (components[component]) {
            component = components[component]
          } else {
            component = Object.entries(components).find(([, comp]) => {
              return comp.fullPath === component
            })

            // No component found via string
            if (!component) { return }

            component = component[1]
          }
        }

        // Component is missing required values
        if (!component?.fullPath || !component?.pascalName) { return }

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
        console.log(`Could not parse ${component?.pascalName || component?.fullPath || 'a component'}!`)
      }
    }

    const fetchComponents = () => Object.values(components).forEach(fetchComponent)

    fetchComponents()

    updateOutput()

    return {
      name: 'component-meta',

      enforce: 'post',

      vite: {
        configureServer (_server) {
          server = _server
        },
        handleHotUpdate ({ file }) {
          if (Object.entries(components).some(([key, comp]) => comp.fullPath === file)) {
            refreshChecker()
            fetchComponent(file)
            updateOutput()
            const cache = server.moduleGraph.getModuleById('/virtual:component-meta-storage')
            server.moduleGraph.invalidateModule(cache)
            server.ws.send({
              type: 'update',
              updates: [
                {
                  path: '/virtual:component-meta-storage',
                  acceptedPath: '/virtual:component-meta-storage',
                  timestamp: +Date.now(),
                  type: 'js-update'

                }
              ]
            })
          }
        }
      },

      resolveId (id) {
        if (id === '#component-meta') {
          return '/virtual:component-meta-storage'
        }
      },

      load (id) {
        if (id === '/virtual:component-meta-storage') {
          console.log(JSON.stringify(components, null, 2))
          return `export const components = ${JSON.stringify(components, null, 2)}`
        }
      }
    }
  })
