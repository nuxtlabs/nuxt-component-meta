export function visit (node, test, visitNode) {
  if (Array.isArray(node)) {
    return node.forEach(n => visit(n, test, visitNode))
  }

  if (!node?.type) { return }

  if (test(node)) {
    visitNode(node)
  }

  switch (node.type) {
    case 'VariableDeclaration':
      visit(node.declarations, test, visitNode)
      break
    case 'VariableDeclarator':
      visit(node.id, test, visitNode)
      visit(node.init, test, visitNode)
      break
    case 'CallExpression':
      visit(node.callee, test, visitNode)
      visit(node.arguments, test, visitNode)
      visit(node.typeParameters, test, visitNode)
      break
    case 'ObjectExpression':
      visit(node.properties, test, visitNode)
      break
    case 'ExpressionStatement':
      visit(node.expression, test, visitNode)
      break
    case 'ObjectProperty':
      visit(node.key, test, visitNode)
      visit(node.value, test, visitNode)
      break
    case 'TSTypeParameterInstantiation':
      visit(node.params, test, visitNode)
      break
    case 'TSTypeLiteral':
      visit(node.members, test, visitNode)
      break
  }
}
