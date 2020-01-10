export default function findAllIndexes(word: string, sentence: string): number[] {
  const indexes = []
  let previousIndex = 0
  let nextIndex = 0

  while (nextIndex !== -1) {
    nextIndex = sentence.search(word)
    indexes.push(nextIndex + previousIndex)
    previousIndex = nextIndex + previousIndex + 1
    sentence = sentence.slice(nextIndex + 1)
  }

  return indexes
}
