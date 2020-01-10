import { diagnostics } from '../lib/editor'
import { Diagnostic } from 'typescript/lib/tsserverlibrary'

function send(query: string): Promise<Diagnostic[]> {
  return diagnostics(`import sql from "sql-template-strings"\n ${query}`)
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

  // it(`returns correct diagnostic for query: ${'sql`SELEC`'}`, async () => {
  //   const [error] = await send('sql`SELEC`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "error",
  //       "code": 1003,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 11,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 6,
  //       },
  //       "text": "Invalid MySQL keyword 'SELEC'. Did you mean 'SELECT'?",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`SELECT id FROM user`'}`, async () => {
  //   const [error] = await send('sql`SELECT id FROM user`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "warning",
  //       "code": 1004,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 25,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 21,
  //       },
  //       "text": "Table 'user' does not exist in database 'test'. Did you mean 'users'?",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`SELECT foo FROM users`'}`, async () => {
  //   const [error] = await send('sql`SELECT foo FROM users`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "warning",
  //       "code": 1005,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 16,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 13,
  //       },
  //       "text": "Column 'foo' does not exist in table 'users'. Did you mean 'id'?",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE i = "foo"`'}`, async () => {
  //   const [error] = await send('sql`SELECT id FROM users WHERE i = "foo"`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "warning",
  //       "code": 1005,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 34,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 33,
  //       },
  //       "text": "Column 'i' does not exist in table 'users'. Did you mean 'id'?",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`CREAT`'}`, async () => {
  //   const [error] = await send('sql`CREAT`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "error",
  //       "code": 1003,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 11,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 6,
  //       },
  //       "text": "Invalid MySQL keyword 'CREAT'. Did you mean 'CREATE'?",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`CREATE TABLE foo (bar in)`'}`, async () => {
  //   const [error] = await send('sql`CREATE TABLE foo (bar in)`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "error",
  //       "code": 1002,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 31,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 6,
  //       },
  //       "text": "MySQL Syntax Error.",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`CREATE TABLE foo (bar integ)`'}`, async () => {
  //   const [error] = await send('sql`CREATE TABLE foo (bar integ)`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "error",
  //       "code": 1003,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 33,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 28,
  //       },
  //       "text": "Invalid MySQL keyword 'integ'. Did you mean 'INDEX'?",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`US foo`'}`, async () => {
  //   const [error] = await send('sql`US foo`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "error",
  //       "code": 1003,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 8,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 6,
  //       },
  //       "text": "Invalid MySQL keyword 'US'. Did you mean 'AS'?",
  //     }
  //   `)
  // })

  // // Type checking

  // it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = ${true}`'}`, async () => {
  //   const [error] = await send('sql`SELECT id FROM users WHERE id = ${true}`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "warning",
  //       "code": 1006,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 45,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 33,
  //       },
  //       "text": "Type boolean is not assignable to type string",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = true`'}`, async () => {
  //   const [error] = await send('sql`SELECT id FROM users WHERE id = true`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "warning",
  //       "code": 1006,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 38,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 33,
  //       },
  //       "text": "Type boolean is not assignable to type string",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = ${null}`'}`, async () => {
  //   const [error] = await send('sql`SELECT id FROM users WHERE id = ${null}`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "warning",
  //       "code": 1006,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 44,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 40,
  //       },
  //       "text": "Type null is not assignable to type string",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = null`'}`, async () => {
  //   const [error] = await send('sql`SELECT id FROM users WHERE id = null`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "warning",
  //       "code": 1006,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 42,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 38,
  //       },
  //       "text": "Type null is not assignable to type string",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = {1}`'}`, async () => {
  //   const [error] = await send('sql`SELECT id FROM users WHERE id = {1}`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "error",
  //       "code": 1002,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 41,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 6,
  //       },
  //       "text": "MySQL Syntax Error.",
  //     }
  //   `)
  // })

  // it(`returns correct diagnostic for query: ${'sql`SELECT id FROM users WHERE id = 1`'}`, async () => {
  //   const [error] = await send('sql`SELECT id FROM users WHERE id = 1`')
  //   expect(error).toMatchInlineSnapshot(`
  //     Object {
  //       "category": "warning",
  //       "code": 1006,
  //       "end": Object {
  //         "line": 2,
  //         "offset": 38,
  //       },
  //       "source": "ts-mysql-plugin",
  //       "start": Object {
  //         "line": 2,
  //         "offset": 33,
  //       },
  //       "text": "Type number is not assignable to type string",
  //     }
  //   `)
  // })
})
