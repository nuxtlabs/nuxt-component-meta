// default to empty permisive object if no componentMeta is defined
const script = ['export const components = {}', 'export default components']

const dts = [
  "import type { NuxtComponentMeta } from 'nuxt-component-meta'",
  'export type { NuxtComponentMeta }',
  'export type NuxtComponentMetaNames = string',
  'declare const components: Record<NuxtComponentMetaNames, NuxtComponentMeta>',
  'export { components as default,  components }'
]

export const writeTemplates = () => {

}
