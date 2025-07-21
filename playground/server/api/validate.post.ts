import { writeFile } from "fs/promises"

import { getComponentMeta } from "../../../src/parser"
import { propsToJsonSchema } from "../../../src/utils"
import { jsonSchemaToZod } from "json-schema-to-zod"
import { formatJS } from "../utils/format"

export default eventHandler(async (event) => {
  const { component, data, strict } = await readBody(event)
  const rootDir = process.cwd()

  await writeFile(`node_modules/test.vue`, component)
  const meta = getComponentMeta('node_modules/test.vue')
  const jsonSchema = propsToJsonSchema(meta.props)
  let zodString = jsonSchemaToZod(jsonSchema, { module: "esm", withJsdocs: true }).trim()
  if (strict) {
    zodString = zodString + '.strict()'
  }
  zodString = await formatJS(zodString)


  await writeFile(`node_modules/test.zod.mjs`, zodString)
  const zod = await import(`${rootDir}/node_modules/test.zod.mjs?time=${Date.now()}`)

  try {
    const validation = zod.default.safeParse(data)
    return {
      success: true,
      validation,
      zodString
    }
  } catch (error) {
    return {
      success: false,
      error,
      zodString
    }
  }
})
