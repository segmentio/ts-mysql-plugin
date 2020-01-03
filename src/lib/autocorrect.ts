import leven from 'leven'

export default function autocorrect(inputWord: string, words: string[]): string | null {
  let bestWord: string | null = null
  let min: number | null = null

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const distance = leven(inputWord, word)

    if (distance === 0) {
      return word
    } else if (!min || distance < min) {
      min = distance
      bestWord = word
    }
  }

  return bestWord
}
