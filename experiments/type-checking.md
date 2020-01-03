# Experiment with Type Checking

- Add `InvalidColumnValueError` to analyzer/errors:

```js
interface InvalidColumnValueErrorData {
  readonly expectedType: string
  readonly receivedType: string
  readonly column: string
  readonly table: string
  readonly start: number
  readonly end: number
}

class InvalidColumnValueError extends QueryError {
  data: InvalidColumnValueErrorData

  constructor(data: InvalidColumnValueErrorData) {
    super()
    this.name = 'InvalidColumnValueError'
    this.data = data
  }
}
```

- Add column type check to analyzer:

```js
// TODO: where to get `valueType`?
if (column.tsType !== valueType) {
  const start = query.indexOf(columnName) + 1
  const end = start + columnName.length
  throw new InvalidColumnValueError({
    expectedType: column.tsType,
    receivedType: valueType,
    column: columnName,
    table: tableName,
    start,
    end
  })
}
```

- Update the language service's `getSemanticDiagnostics` to handle the error:

```js
case 'InvalidColumnValueError': {
  diagnostics.push(
    this.createDiagnostic(context, {
      message: `Type ${data.receivedType} is not assignable to type ${data.expectedType}`,
      category: DiagnosticCategory.Warning,
      start: data.start - 1,
      length: data.column.length
    })
  )
  break
}
```

Can value type be found by using the Typescript compiler API?

```js
const checker = project.getProgram()?.getTypeChecker()
const expressions = getTemplateExpressions(context.node)
expressions.forEach(expression => {
  const dataType = checker.getTypeAtLocation(expression)
  const flag = dataType.getFlags()

  if (flag === TypeFlags.NumberLiteral) {
    // do something
  } else if (flag === TypeFlags.StringLiteral) {
    // do something
  }
})

function getTemplateExpressions(node: TemplateLiteral) {
  if (isTemplateExpression(node)) {
    return node.templateSpans.map(span => span.expression)
  }
  return []
}
```
