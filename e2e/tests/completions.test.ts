import { CompletionEntry } from 'typescript/lib/tsserverlibrary'
import client from '../lib/client'

beforeAll(async () => {
  await client.connect()
})

afterAll(async () => {
  await client.disconnect()
})

describe('Completions', () => {
  it('returns completions for keywords', async () => {
    const completions = await client.getCompletionsAtPosition('sql`SELECT * FRO`', {
      offset: 16,
      line: 1
    })
    const completionItem = completions.find((item: CompletionEntry) => item.name === 'FROM')
    expect(completionItem).toMatchInlineSnapshot(`
      Object {
        "kind": "keyword",
        "kindModifiers": "",
        "name": "FROM",
        "sortText": "FROM",
      }
    `)
  })

  it('returns completions for tables', async () => {
    const completions = await client.getCompletionsAtPosition('sql`SELECT * FROM user`', {
      offset: 22,
      line: 1
    })
    const completionItem = completions.find((item: CompletionEntry) => item.name === 'users')
    expect(completionItem).toMatchInlineSnapshot(`
      Object {
        "kind": "class",
        "kindModifiers": "",
        "name": "users",
        "sortText": "users",
      }
    `)
  })

  it('returns completions for columns', async () => {
    const completions = await client.getCompletionsAtPosition('sql`SELECT friend FROM users`', {
      offset: 13,
      line: 1
    })
    const completionItem = completions.find((item: CompletionEntry) => item.name === 'friends')
    expect(completionItem).toMatchInlineSnapshot(`
      Object {
        "kind": "property",
        "kindModifiers": "",
        "name": "friends",
        "sortText": "friends",
      }
    `)
  })
})
