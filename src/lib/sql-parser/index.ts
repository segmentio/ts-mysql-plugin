import spawn from 'cross-spawn'
import Logger from '../../logger'
import path from 'path'

export type Tables = Table[]
export type TableColumns = TableColumn[]
export type TableRows = TableRow[]

export interface Table {
  name: string
  alias: string
  columns: TableColumns
  rows: TableRows
}

export interface TableColumn {
  name: string
  inType: string // "expression" or "list"?
  // eslint-disable-next-line
  value?: any
  tsType?: string
  operator?: string
}

export interface TableRow {
  tsType: string
  // eslint-disable-next-line
  value: any
}

export interface ParseResultError {
  near: string
  position: number
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

export function parse(query: string, logger: Logger): ParseResult | null {
  const binaryTarget = path.resolve(__dirname, `../../sql-parser-${process.platform}`)
  const program = spawn.sync(binaryTarget, ['--query', query, 'parse'])
  const result = program.stdout.toString()
  try {
    const parsedResult = JSON.parse(result)
    return parsedResult
  } catch (e) {
    logger.log('Error in SQL parsing - query: ' + query)
    logger.log('Error in SQL parsing - result: ' + result)
    // do not break plugin
    return null
  }
}
