import { helpData, SQLTopic } from './help'

const topics = helpData.topics
const functions = topics.filter(t => t.type === 'function')
const keywords = topics.filter(t => t.type === 'keyword')

function code(str: string): string {
  return '```sql\n' + str + '\n```'
}

function backtick(str?: string): string {
  return '`' + str + '`\n'
}

export function generateDocumentation(word: string, type: 'function' | 'keyword'): string {
  let topic: SQLTopic | undefined

  if (type === 'function') {
    topic = functions.find(f => f.name === word.toUpperCase())
  } else if (type === 'keyword') {
    topic = keywords.find(k => k.name === word.toUpperCase())
  }

  if (!topic) {
    return ''
  }

  return [
    backtick(topic.category),
    topic.description,
    code(topic.codeExample),
    `[${topic.reference.name}](${topic.reference.url})`
  ].join('\n')
}
