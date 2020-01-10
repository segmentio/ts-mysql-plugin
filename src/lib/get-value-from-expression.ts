import ts from 'typescript/lib/tsserverlibrary'
import Logger from '../logger'

const { InTypeAlias, NoTruncation } = ts.TypeFormatFlags

export default function getValueFromExpression(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  logger: Logger
): string {
  const locationType = checker.getTypeAtLocation(expression)
  const apparentType = checker.getApparentType(locationType)
  const value = checker.typeToString(locationType, expression, InTypeAlias | NoTruncation)
  const type = checker.typeToString(apparentType, expression, InTypeAlias | NoTruncation)

  logger.log('getValueFromExpression - raw: ' + expression.getText())
  logger.log('getValueFromExpression - type: ' + type)
  logger.log('getValueFromExpression - value: ' + value)

  switch (type) {
    case 'null':
      return value
    case 'String':
      // TODO: explain why this is needed.
      if (value === 'string') {
        return "'string'"
      }
      return value
    case 'Number':
      // TODO: explain why this is needed.
      if (value === 'number') {
        return '12345'
      }
      return value
    case 'Boolean':
      // TODO: explain why this is needed.
      if (value === 'boolean') {
        return 'true'
      }
      return value
    case 'Date':
      return `"${new Date().toISOString()}"`
    default:
      return ''
  }
}
