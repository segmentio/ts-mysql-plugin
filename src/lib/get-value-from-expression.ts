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
  let value = checker.typeToString(locationType, expression, InTypeAlias | NoTruncation)
  let type = checker.typeToString(apparentType, expression, InTypeAlias | NoTruncation)

  if (locationType.isUnion()) {
    // Choose the first type for intersections. e.g. "string | null"
    type = value.split('|')[0]
    value = type
  }

  logger.log('getValueFromExpression - raw: ' + expression.getText())
  logger.log('getValueFromExpression - type: ' + type)
  logger.log('getValueFromExpression - value: ' + value)

  //
  // Note: the extra checks for `value === TYPE` are for scenarios where there's
  // an embedded expression in the query. For example, for the following scenario:
  //
  //     defaultId = 'foo', sql`SELECT * FROM foo where id = ${defaultId}`
  //
  //     defaultId will have:
  //       raw: 'defaultConnectionId'
  //       type: 'String'
  //       value: 'string'
  //
  // We want to substitute `'string'` not `string`, thus, we need to return "'string'".
  //

  const substitutionLength = expression.getText().length

  switch (type) {
    case 'null':
      return value
    case 'String':
      // Embedded expression
      if (value === 'string') {
        // Add 1 to account for the 3 characters in `${}`, but we're also adding `'` twice, so we're subtracting that out.
        return "'" + 'x'.repeat(substitutionLength + 1) + "'"
      }
      return value
    case 'Number':
      // Add 3 to account for `${}`
      return '1'.repeat(substitutionLength + 3)
    // Weird situation.
    case 'boolean':
    case 'Boolean': {
      // Literals and normal embedded expressions go here. Boolean is just a weird case.
      // Note: here we assume that the variable representing the boolean is greater than or equal to 4 characters
      // 4 characters is the number of characters in the string "true"
      const spacesToAdd = substitutionLength - 1
      return 'true' + ' '.repeat(spacesToAdd)
    }
    case 'Date':
      // Doesn't matter if embedded or not, because we need the format to be an ISO string
      // to send to the parser.
      return `"${new Date().toISOString()}"`
    default:
      return ''
  }
}
