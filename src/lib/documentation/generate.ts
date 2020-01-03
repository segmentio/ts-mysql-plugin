import { keywordData } from './keywords'

const keywords = keywordData.keywords

function code(str: string): string {
  return '```sql\n' + str + '\n```'
}

function backtick(str?: string): string {
  return '`' + str + '`\n'
}

export default function generate(keyword: string): string {
  const doc = keywords.find(k => k.name === keyword.toUpperCase())
  if (!doc) {
    return ''
  }

  return [
    backtick(doc.category),
    doc.description,
    code(doc.codeExample),
    `[${doc.reference.name}](${doc.reference.url})`
  ].join('\n')
}
