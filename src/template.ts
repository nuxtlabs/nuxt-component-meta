export default (components: any[]): string => `// empty line
import { pascalCase } from 'scule'

export const components = ${JSON.stringify(components)}
export const getComponent = name => {
  name = pascalCase(name)
  return components.find(c => c.name === name)
}
`
