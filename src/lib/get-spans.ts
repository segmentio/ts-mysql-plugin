import ts from 'typescript/lib/tsserverlibrary'

interface Span {
  expression: ts.Expression
  start: number
  end: number
}

export default function getSpans(node: ts.TemplateExpression): Span[] {
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
