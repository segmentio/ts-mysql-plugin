import { Expression, TypeChecker } from 'typescript'
import { toSimpleType, SimpleTypeKind, SimpleType } from 'ts-simple-type'

function resolveType(type: SimpleType): string | null {
  switch (type.kind) {
    case SimpleTypeKind.BOOLEAN:
    case SimpleTypeKind.BOOLEAN_LITERAL:
      return 'boolean'
    case SimpleTypeKind.NUMBER:
    case SimpleTypeKind.NUMBER_LITERAL:
    case SimpleTypeKind.BIG_INT:
    case SimpleTypeKind.BIG_INT_LITERAL:
      return 'number'
    case SimpleTypeKind.STRING:
    case SimpleTypeKind.STRING_LITERAL:
      return 'string'
    case SimpleTypeKind.ARRAY:
      return 'array'
    case SimpleTypeKind.DATE:
      return 'date'
    case SimpleTypeKind.NULL:
      return 'null'
    case SimpleTypeKind.ENUM:
      return 'enum'
    case SimpleTypeKind.ENUM_MEMBER:
      return resolveType(type.type)
    case SimpleTypeKind.UNION:
      return 'union'
    case SimpleTypeKind.INTERFACE:
      return 'interface'
    case SimpleTypeKind.TUPLE:
      return 'tuple'
    case SimpleTypeKind.UNDEFINED:
      return 'undefined'
    case SimpleTypeKind.NEVER:
      return 'never'
    case SimpleTypeKind.UNKNOWN:
      return 'unknown'
    case SimpleTypeKind.INTERSECTION:
      return 'intersection'
    case SimpleTypeKind.CLASS:
      return 'class'
    case SimpleTypeKind.ANY:
      return 'any'
  }

  return null
}

export default function inferType(expression: Expression, checker: TypeChecker): string | null {
  const type = toSimpleType(expression, checker)
  return resolveType(type)
}
