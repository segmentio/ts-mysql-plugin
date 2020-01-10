import spawn from 'cross-spawn'
import path from 'path'

export type Tables = Table[]
export type TableColumns = TableColumn[]

export interface Table {
  name: string
  alias: string
  columns: TableColumns
}

export interface TableColumn {
  name: string
  inType: string // "expression" or "list"?
  // eslint-disable-next-line
  value?: any
  tsType?: string
  operator?: string
}

export interface ParseResultError {
  name: string
  message: string
}

export type Statements = Statement[]

export interface Statement {
  /* The SQL statement type */
  type: string
  /* The SQL tables/columns in the query */
  tables: Tables
  /* The SQL abstract syntax tree */
  tree: {
    // eslint-disable-next-line
    [name: string]: any
  }
}

export interface ParseResult {
  statements: Statement[]
  error?: ParseResultError
}

export function parse(query: string): ParseResult {
  const binaryTarget = path.resolve(__dirname, `../../sql-parser-${process.platform}`)
  const program = spawn.sync(binaryTarget, ['--query', query.trim(), 'parse'])
  const result = program.stdout.toString()
  return JSON.parse(result)
}
