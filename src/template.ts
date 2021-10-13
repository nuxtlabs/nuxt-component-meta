export default (components: any[]): string => `// empty line
export const components = ${JSON.stringify(components)}
`
