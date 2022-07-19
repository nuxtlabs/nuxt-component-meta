import * as ts from 'typescript'
import type { SFCDescriptor } from '@vue/compiler-sfc'

export function parseTSSetupScript (id: string, descriptor: SFCDescriptor) {
  const props = []

  // const program = ts.createProgram([`${id}.vue.ts`], {})
  const source = ts.createSourceFile(
      `${id}.vue.ts`,
      descriptor.scriptSetup.content,
      ts.ScriptTarget.Latest,
      true
  )

  // 1. extract file infos (types, extrernal types and defineProps / defineEmits calls)
  ts.forEachChild(source, (node) => {
    if (ts.isImportDeclaration(node)) {
      // extract imported types
      const path = node.moduleSpecifier.getText()
      let imports = []

      if (node.importClause.isTypeOnly && node.importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
        imports = node.importClause.namedBindings.elements.map(e => e.name.text)
      }

      console.log({
        path,
        imports
      })
    } else if (ts.isTypeAliasDeclaration(node)) {
      // extract type aliases
      const name = node.name.text
      const type = node.type.getText()

      console.log({
        name,
        type
      })
    } else if (ts.isInterfaceDeclaration(node)) {
      // extract interfaces

      const name = node.name.escapedText
      const members = node.members.map((m, index) => {
        if (ts.isCallSignatureDeclaration(m)) {
          // call signatures should be emits declarations
          // extract call parameters
          console.log(m.typeParameters)
          return {
            key: index,
            type: m.getText()
          }
        } else if (ts.isPropertySignature(m)) {
          // members should be properties
          return {
            key: m.name.getText(),
            type: m.type.getText()
          }
        }

        return {
          key: 'unknown',
          type: 'unknown'
        }
      })
      console.log({
        name,
        members
      })
    } else if (ts.isVariableStatement(node)) {
      // here we need to find defineEmits / withDefaults / defineProps calls
      // and extract either the generic type info or the default value of destructured props
      console.log(node.kind)
    }
  })

  // 2. resolve defineProps / defineEmits type parameters to the actual types

  return {
    props
  }
}
