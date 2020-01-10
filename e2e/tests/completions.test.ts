import { CompletionEntry } from 'typescript/lib/tsserverlibrary'
import { complete } from '../lib/editor'

describe('Completions', () => {
  it('returns SQL keyword completions', async () => {
    const completions = await complete('sql`SELECT * FRO`', {
      offset: 16,
      line: 1
    })
    expect(completions.some((item: CompletionEntry) => item.name === 'JOIN')).toBeTruthy()
    expect(completions.some((item: CompletionEntry) => item.name === 'FROM')).toBeTruthy()
  })
})
