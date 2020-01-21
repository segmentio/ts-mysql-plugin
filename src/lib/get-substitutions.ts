import ts from 'typescript/lib/tsserverlibrary'
import inferType from './infer-type'

function resolveType(expression: ts.Expression, checker: ts.TypeChecker): string | null {
  const length = expression.getText().length
  const type = inferType(expression, checker)

  // in order to preserve the length of the original string, we need to make
  // substitutions that add up to that length

  switch (type) {
    case 'null':
      return 'null' + ' '.repeat(length - 1)
    case 'boolean':
      return 'true' + ' '.repeat(length - 1)
    case 'string':
      return `"${'x'.repeat(length + 1)}"`
    case 'number':
      return '1'.repeat(length + 3)
    case 'date':
      return `"${new Date().toISOString()}"`
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

function fallback(span: Span): string {
  const value = 'x'.repeat(span.end - span.start - 2)
  return `'${value}'`
}

export default function getTemplateSubstitutions(
  checker: ts.TypeChecker | undefined,
  node: ts.TemplateExpression
): string {
  const contents = node.getText().slice(1, -1)
  const spans = getSpans(node)
  const parts: string[] = []
  let lastIndex = 0

  for (const span of spans) {
    parts.push(contents.slice(lastIndex, span.start))
    const expression = span.expression

    // if there's a type checker, resolve the type
    if (checker) {
      const value = resolveType(expression, checker)
      if (value) {
        parts.push(value)
      } else {
        // fallback if we can't resolve the type
        parts.push(fallback(span))
      }
    } else {
      // else fallback
      parts.push(fallback(span))
    }

    lastIndex = span.end
  }

  parts.push(contents.slice(lastIndex))

  return parts.join('')
}
