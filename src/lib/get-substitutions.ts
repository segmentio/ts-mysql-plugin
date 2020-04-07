import ts from 'typescript/lib/tsserverlibrary'
import { TemplateSubstitutions, TemplateSubstitution } from 'typescript-template-language-service-decorator'
import inferType from './infer-type'

function resolveType(expression: ts.Expression, checker: ts.TypeChecker): string | null {
  const length = expression.getText().length
  const type = inferType(expression, checker)

  // in order to preserve the length of the original string, we need to make
  // substitutions that add up to that length
  switch (type) {
    case 'string':
      return `"${'x'.repeat(length + 1)}"`
    case 'number':
      return '1'.repeat(length + 3)
    case 'boolean':
      return 'true'
    case 'date':
      return `"${new Date().toISOString()}"`
    case 'null':
      return 'null'
    default:
      return null
  }
}

interface Span {
  expression: ts.Expression
  start: number
  end: number
}

function getSpans(node: ts.TemplateExpression): Span[] {
  const spans = []
  const stringStart = node.getStart() + 1

  let nodeStart = node.head.end - stringStart - 2
  for (const templateSpan of node.templateSpans) {
    const literal = templateSpan.literal
    const start = literal.getStart() - stringStart + 1
    const expression = templateSpan.expression
    spans.push({ start: nodeStart, end: start, expression })
    nodeStart = literal.getEnd() - stringStart - 2
  }

  return spans
}

function getValue(expression: ts.Expression, span: Span, checker?: ts.TypeChecker): string {
  if (checker) {
    const value = resolveType(expression, checker)
    if (value) {
      return value
    }
  }

  const value = 'x'.repeat(span.end - span.start - 2)
  return `'${value}'`
}

export default function getTemplateSubstitutions(
  checker: ts.TypeChecker | undefined,
  node: ts.TemplateExpression
): TemplateSubstitutions {
  const contents = node.getText().slice(1, -1)
  const spans = getSpans(node)
  const parts: string[] = []
  let lastIndex = 0

  const substitutions: TemplateSubstitution[] = []

  for (const span of spans) {
    parts.push(contents.slice(lastIndex, span.start))

    const expression = span.expression
    const value = getValue(expression, span, checker)
    parts.push(value)

    substitutions.push({
      start: span.start,
      oldStop: span.end,
      newStop: span.end + Math.abs(expression.getText().length - value.length)
    })

    lastIndex = span.end
  }

  parts.push(contents.slice(lastIndex))

  return {
    text: parts.join(''),
    substitutions
  }
}
