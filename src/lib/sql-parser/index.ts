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
  value?: any
  tsType?: string
  operator?: string
}

export interface ParseResultError {
  name: string
  message: string
}

export interface ParseResultData {
  tables: Tables
  /* The SQL statement type */
  type: string
  tree: {
    // eslint-disable-next-line
    [name: string]: any
  }
}

export interface ParseResult {
  error: ParseResultError
  data: ParseResultData
}

export function parse(query: string): ParseResult {
  const binaryTarget = path.resolve(__dirname, `../../../sql-parser-${process.platform}`)
  const program = spawn.sync(binaryTarget, ['--query', query, 'parse'])
  const result = program.stdout.toString()
  return JSON.parse(result)
}
