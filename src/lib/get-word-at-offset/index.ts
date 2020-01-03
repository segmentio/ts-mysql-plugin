import { DEFAULT_WORD_REGEXP } from './word-regexp'

interface WordWithRange {
  word: string
  startOffset: number
  endOffset: number
}

export default function(offset: number, text: string): WordWithRange | null {
  const wordDefinition = DEFAULT_WORD_REGEXP
  wordDefinition.lastIndex = 0

  let match: RegExpMatchArray | null
  while ((match = wordDefinition.exec(text))) {
    const matchIndex = match.index || 0
    if (matchIndex > offset) {
      // |nW -> matched only after the pos
      return null
    } else if (wordDefinition.lastIndex >= offset) {
      // W|W -> match encloses pos
      return {
        word: match[0],
        startOffset: matchIndex,
        endOffset: wordDefinition.lastIndex
      }
    }
  }

  return null
}
