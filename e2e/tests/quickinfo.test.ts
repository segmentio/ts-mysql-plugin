import client from '../lib/client'

beforeAll(async () => {
  await client.connect()
})

afterAll(async () => {
  await client.disconnect()
})

describe('QuickInfo', () => {
  it('returns quickinfo for keywords', async () => {
    const quickInfo = await client.getQuickInfoAtPosition('sql`SELECT * FROM users`', {
      offset: 16,
      line: 1
    })
    expect(quickInfo).toMatchInlineSnapshot(`
      Object {
        "displayString": "",
        "documentation": "\`DML\`

      Specifies which table to select or delete data from.
      \`\`\`sql
      SELECT foo FROM bar
      \`\`\`
      [W3 Reference](https://www.w3schools.com/sql/sql_ref_from.asp)",
        "end": Object {
          "line": 1,
          "offset": 18,
        },
        "kind": "string",
        "kindModifiers": "",
        "start": Object {
          "line": 1,
          "offset": 14,
        },
        "tags": Array [],
      }
    `)
  })

  it('returns quickinfo for tables', async () => {
    const quickInfo = await client.getQuickInfoAtPosition('sql`SELECT * FROM users`', {
      offset: 23,
      line: 1
    })
    expect(quickInfo).toMatchInlineSnapshot(`
      Object {
        "displayString": "",
        "documentation": "| Name    | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | SQL Type  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | TS Type | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Optional |
      | ------- | ------------------------------ | --------- | ------------------------------ | ------- | ------------------------------ | -------- |
      | id      | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | varbinary | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | string  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | false    |
      | name    | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | varbinary | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | string  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | true     |
      | email   | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | varbinary | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | string  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | true     |
      | created | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | timestamp | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | date    | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | false    |
      | enabled | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | tinyint   | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | boolean | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | false    |
      | friends | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | int       | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | number  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | false    |
      | project | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | int       | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | number  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | true     |",
        "end": Object {
          "line": 1,
          "offset": 24,
        },
        "kind": "string",
        "kindModifiers": "",
        "start": Object {
          "line": 1,
          "offset": 19,
        },
        "tags": Array [],
      }
    `)
  })

  it('returns quickinfo for columns', async () => {
    const quickInfo = await client.getQuickInfoAtPosition('sql`SELECT id FROM users`', {
      offset: 20,
      line: 1
    })
    expect(quickInfo).toMatchInlineSnapshot(`
      Object {
        "displayString": "",
        "documentation": "| Name    | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | SQL Type  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | TS Type | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Optional |
      | ------- | ------------------------------ | --------- | ------------------------------ | ------- | ------------------------------ | -------- |
      | id      | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | varbinary | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | string  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | false    |
      | name    | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | varbinary | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | string  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | true     |
      | email   | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | varbinary | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | string  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | true     |
      | created | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | timestamp | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | date    | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | false    |
      | enabled | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | tinyint   | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | boolean | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | false    |
      | friends | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | int       | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | number  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | false    |
      | project | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | int       | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | number  | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | true     |",
        "end": Object {
          "line": 1,
          "offset": 25,
        },
        "kind": "string",
        "kindModifiers": "",
        "start": Object {
          "line": 1,
          "offset": 20,
        },
        "tags": Array [],
      }
    `)
  })
})
