import { Diagnostic } from 'typescript/lib/tsserverlibrary'
import client from '../lib/client'

beforeAll(async () => {
  await client.connect()
})

afterAll(async () => {
  await client.disconnect()
})

function send(query: string): Promise<Diagnostic[]> {
  return client.getSemanticDiagnostics(`import sql, { empty, join, raw } from "sql-template-tag"\n ${query}`)
}

describe('Diagnostics', () => {
  it(`returns correct diagnostic for query: ${'sql``'}`, async () => {
    const [error] = await send('sql``')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "error",
        "code": 1001,
        "end": Object {
          "line": 2,
          "offset": 7,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 5,
        },
        "text": "Empty MySQL query.",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`       `'}`, async () => {
    const [error] = await send('sql``')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "error",
        "code": 1001,
        "end": Object {
          "line": 2,
          "offset": 7,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 5,
        },
        "text": "Empty MySQL query.",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELEC`'}`, async () => {
    const [error] = await send('sql`SELEC`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "error",
        "code": 1004,
        "end": Object {
          "line": 2,
          "offset": 11,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 6,
        },
        "text": "MySQL Syntax Error. Unidentified word 'SELEC'. Did you mean 'SELECT'?",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM user`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM user`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1005,
        "end": Object {
          "line": 2,
          "offset": 25,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 21,
        },
        "text": "Table 'user' does not exist in database 'test'. Did you mean 'users'?",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT foo FROM users`'}`, async () => {
    const [error] = await send('sql`SELECT foo FROM users`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1006,
        "end": Object {
          "line": 2,
          "offset": 16,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 13,
        },
        "text": "Column 'foo' does not exist in table 'users'. Did you mean 'id'?",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE i = "foo"`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM users WHERE i = "foo"`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1006,
        "end": Object {
          "line": 2,
          "offset": 34,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 33,
        },
        "text": "Column 'i' does not exist in table 'users'. Did you mean 'id'?",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`CREAT`'}`, async () => {
    const [error] = await send('sql`CREAT`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "error",
        "code": 1004,
        "end": Object {
          "line": 2,
          "offset": 11,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 6,
        },
        "text": "MySQL Syntax Error. Unidentified word 'CREAT'. Did you mean 'CREATE'?",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`CREATE TABLE foo (bar in)`'}`, async () => {
    const [error] = await send('sql`CREATE TABLE foo (bar in)`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "error",
        "code": 1003,
        "end": Object {
          "line": 2,
          "offset": 30,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 28,
        },
        "text": "MySQL Syntax Error. The problem is near the word 'in', which is a reserved keyword. Are you missing a semicolon? Did you forget to backtick a column name?",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`CREATE TABLE foo (bar integ)`'}`, async () => {
    const [error] = await send('sql`CREATE TABLE foo (bar integ)`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "error",
        "code": 1004,
        "end": Object {
          "line": 2,
          "offset": 33,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 28,
        },
        "text": "MySQL Syntax Error. Unidentified word 'integ'. Did you mean 'INDEX'?",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`US foo`'}`, async () => {
    const [error] = await send('sql`US foo`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "error",
        "code": 1004,
        "end": Object {
          "line": 2,
          "offset": 8,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 6,
        },
        "text": "MySQL Syntax Error. Unidentified word 'US'. Did you mean 'AS'?",
      }
    `)
  })

  // Type checking

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = ${true}`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM users WHERE id = ${true}`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 2,
          "offset": 45,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 33,
        },
        "text": "Type boolean is not assignable to type string",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = true`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM users WHERE id = true`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 2,
          "offset": 38,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 33,
        },
        "text": "Type boolean is not assignable to type string",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = ${null}`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM users WHERE id = ${null}`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 2,
          "offset": 45,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 33,
        },
        "text": "Type null is not assignable to type string",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = null`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM users WHERE id = null`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 2,
          "offset": 38,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 33,
        },
        "text": "Type null is not assignable to type string",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = ${1}`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM users WHERE id = ${1}`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 2,
          "offset": 42,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 33,
        },
        "text": "Type number is not assignable to type string",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = 1`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM users WHERE id = 1`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 2,
          "offset": 38,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 33,
        },
        "text": "Type number is not assignable to type string",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'const someDate = new Date()\n sql`SELECT id FROM users WHERE id = ${someDate}`'}`, async () => {
    const [error] = await send('const someDate = new Date()\n sql`SELECT id FROM users WHERE id = ${someDate}`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 3,
          "offset": 49,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 3,
          "offset": 33,
        },
        "text": "Type date is not assignable to type string",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = ${new Date()}`'}`, async () => {
    const [error] = await send('sql`SELECT id FROM users WHERE id = ${new Date()}`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 2,
          "offset": 38,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 33,
        },
        "text": "Type date is not assignable to type string",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`INSERT INTO users (id) VALUES (${new Date()})`'}`, async () => {
    const [error] = await send('sql`INSERT INTO users (id) VALUES (${new Date()})`')
    expect(error).toMatchInlineSnapshot(`undefined`)
  })

  it(`returns correct diagnostic for query: ${'sql`INSERT INTO users (id, enabled) VALUES ("1")`'}`, async () => {
    const [error] = await send('sql`INSERT INTO users (id, enabled) VALUES ("1")`')
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1008,
        "end": Object {
          "line": 2,
          "offset": 50,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 2,
          "offset": 6,
        },
        "text": "Column count does not match row count.",
      }
    `)
  })

  it(`returns correct diagnostic for query: ${'sql`INSERT INTO users (id, created) VALUES ("1")`'}`, async () => {
    const content = [
      "const user = { id: 'some-id', created: new Date() }",
      'sql`INSERT INTO users (id, created) VALUES (${user.id}, ${user.created})`'
    ].join('\n')
    const [error] = await send(content)
    expect(error).toMatchInlineSnapshot(`undefined`)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT * FROM users WHERE id IN (${join(input.ids)})`'}`, async () => {
    const content = [
      "const input = { ids: ['some-id-1', 'some-id-2'] }",
      'sql`SELECT * FROM users WHERE id IN (${join(input.ids)})`'
    ].join('\n')
    const [error] = await send(content)
    expect(error).toMatchInlineSnapshot(`undefined`)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT * FROM users WHERE id = ${enumMember}`'}`, async () => {
    const content = [
      "enum colors { GREEN = 'GREEN', BLUE = 'BLUE', RED = 'RED' }",
      'sql`SELECT * FROM users WHERE id = ${colors.GREEN}`'
    ].join('\n')
    const [error] = await send(content)
    expect(error).toMatchInlineSnapshot(`undefined`)
  })

  it(`returns correct diagnostic for query: ${'sql`SELECT * FROM users WHERE id = ${enumMember}`'}`, async () => {
    const content = [
      "enum colors { GREEN = 'GREEN', BLUE = 'BLUE', RED = 'RED' }",
      'sql`SELECT * FROM users WHERE enabled = ${colors.GREEN}`'
    ].join('\n')
    const [error] = await send(content)
    expect(error).toMatchInlineSnapshot(`
      Object {
        "category": "warning",
        "code": 1007,
        "end": Object {
          "line": 3,
          "offset": 56,
        },
        "source": "ts-mysql-plugin",
        "start": Object {
          "line": 3,
          "offset": 31,
        },
        "text": "Type string is not assignable to type boolean",
      }
    `)
  })
})
