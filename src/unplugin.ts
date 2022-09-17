
import { writeFileSync } from 'fs'
import { log } from 'console'
import { defu } from 'defu'
import { createUnplugin } from 'unplugin'
import { createComponentMetaCheckerByJsonConfig } from 'vue-component-meta'
import { resolveModule } from '@nuxt/kit'
import { join } from 'pathe'
import virtual, { updateVirtualModule } from 'vite-plugin-virtual'

export const META_CACHE_KEY = 'virtual:component-meta'

interface ComponentReferences {
}

export const storagePlugin = virtual({
  [META_CACHE_KEY]: 'export default {}'
})

export const metaPlugin = createUnplugin<any>(
  (options) => {
    const outputPath = join(options.outputDir, 'component-meta-cache')

    /**
     * Initialize component data object from components
     */
    const components = {
      ...(options?.components || []).reduce(
        (acc, component) => {
          if (!component.filePath || !component.pascalName) { return acc }

          const filePath = resolveModule(component.filePath, { paths: [options.rootDir] })

          acc[component.pascalName] = {
            ...component,
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
      const content = `export default ${getStringifiedComponents()}`

      // Main export of comopnent datas
      writeFileSync(
        outputPath + '.mjs',
        content,
        'utf-8'
      )

      /* We might want to generate typings from components as well.
      writeFileSync(
        outputPath + '.ts',
        `export type ComponentMetaNames = '${Object.keys(components).join('\' |\n\'')}'`
      )
      */

      updateVirtualModule(storagePlugin, META_CACHE_KEY, content)
    }

    const fetchComponent = (component: string | any) => {
      try {
        if (typeof component === 'string') {
          if (components[component]) {
            component = components[component]
          } else {
            component = Object.entries(components).find(([, comp]: any) => (comp.filePath === component))

            // No component found via string
            if (!component) { return }

            component = component[1]
          }
        }

        // Component is missing required values
        if (!component?.filePath || !component?.pascalName) { return }

        const { props, slots, events, exposed } = checker.getComponentMeta(component.filePath)

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
        !options?.silent && console.log(`Could not parse ${component?.pascalName || component?.filePath || 'a component'}!`)
      }
    }

    const fetchComponents = () => Object.values(components).forEach(fetchComponent)

    return {
      name: 'component-meta',

      enforce: 'post',

      vite: {
        configureServer () {
          fetchComponents()
          updateOutput()
        },
        handleHotUpdate ({ file, server }) {
          if (Object.entries(components).some(([, comp]: any) => comp.filePath === file)) {
            refreshChecker()
            fetchComponent(file)
            updateOutput()
            server.ws.send({
              type: 'custom',
              event: 'component-meta:update',
              data: getComponents()
            })
          }
        }
      },

      resolveId (id) {
        if (id.includes('#nuxt-component-meta')) {
          return id.replace('#nuxt-component-meta', META_CACHE_KEY)
        }
      }
    }
  })
