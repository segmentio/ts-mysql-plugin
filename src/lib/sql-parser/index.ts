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
  value?: any
  tsType?: string
  operator?: string
}

interface ParseResultError {
  name: string
  message: string
}

interface ParseResultData {
  ast: {
    // eslint-disable-next-line
    [name: string]: any
  }
  tables: Tables
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
