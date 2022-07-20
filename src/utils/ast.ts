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
    case 'ExportDefaultDeclaration':
      visit(node.declaration, test, visitNode)
      break
  }
}

export function getValue (prop) {
  if (!prop?.type) {
    return undefined
  }
  if (prop.type.endsWith('Literal')) {
    return prop.value
  }

  if (prop.type === 'Identifier') {
    return prop.name === 'undefined' ? undefined : prop.name
  }

  if (prop.type === 'TSAsExpression') {
    return {
      type: getValue(prop.expression),
      as: getType(prop.typeAnnotation)
    }
  }
  if (prop.type === 'ArrayExpression') {
    return prop.elements.map(getValue)
  }

  if (prop.type === 'ObjectExpression') {
    return prop.properties.reduce((acc, prop) => {
      acc[prop.key.name] = getValue(prop.value)
      return acc
    }, {})
  }
}

export function getType (tsProperty) {
  const { type, typeName, elementType, typeParameters } = tsProperty.typeAnnotation?.typeAnnotation || tsProperty
  switch (type) {
    case 'TSStringKeyword':
      return 'String'
    case 'TSNumberKeyword':
      return 'Number'
    case 'TSBooleanKeyword':
      return 'Boolean'
    case 'TSObjectKeyword':
      return 'Object'
    case 'TSTypeReference':
      if (typeParameters?.params) {
        if (typeName.name === 'PropType') {
          return getType(typeParameters.params[0])
        }
        return {
          type: typeName.name,
          elementType: typeParameters.params.map(type => getType(type))
        }
      }
      return typeName.name
    case 'TSArrayType':
      return {
        type: 'Array',
        elementType: getType(elementType)
      }
  }
}
