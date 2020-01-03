export default function findAllIndexes(word: string, sentence: string): number[] {
  const indexes = []
  let previousIndex = 0

  while (true) {
    const nextIndex = sentence.search(word)
    if (nextIndex === -1) {
      return indexes
    }
    indexes.push(nextIndex + previousIndex)
    previousIndex = nextIndex + previousIndex + 1
    sentence = sentence.slice(nextIndex + 1)
  }
}
