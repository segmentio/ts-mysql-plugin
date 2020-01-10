import { diagnostics } from '../lib/editor'
import { Diagnostic } from 'typescript/lib/tsserverlibrary'

describe('Diagnostics', () => {
  it('returns SQL keyword completions', async () => {
    const [error] = await send('sql``')
    expect(error).toMatchObject({
      start: { line: 2, offset: 5 },
      end: { line: 2, offset: 7 },
      text: 'Empty MySQL query.',
      code: 1001,
      category: 'error',
      source: 'ts-mysql-plugin'
    })
  })

  it('returns SQL keyword completions', async () => {
    const [error] = await send('sql`SELEC`')
    expect(error).toMatchObject({
      start: { line: 2, offset: 6 },
      end: { line: 2, offset: 11 },
      text: "Invalid MySQL keyword 'SELEC'. Did you mean 'SELECT'?",
      code: 1003,
      category: 'error',
      source: 'ts-mysql-plugin'
    })
  })
})

function send(query: string): Promise<Diagnostic[]> {
  return diagnostics(`import sql from "sql-template-strings"\n ${query}`)
}
