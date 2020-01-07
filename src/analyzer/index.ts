import {
  EmptyQueryError,
  InvalidColumnError,
  InvalidKeywordError,
  InvalidSyntaxError,
  InvalidTableError,
  InvalidColumnValueError
} from './errors'
import { keywords } from '../constants/keywords'
import {
  parse,
  ParseResult,
  Table as QueryTable,
  Tables as QueryTables,
  TableColumn as QueryColumn
} from '../lib/sql-parser'
import { Table as SchemaTable, Tables as SchemaTables, Column as SchemaColumn } from '../schema'
import getWordAtOffset from '../lib/get-word-at-offset'
import findAllIndexes from '../lib/find-all-indexes'

interface SyntaxErrorData {
  readonly near: string
  readonly start: number
  readonly end: number
}

interface Position {
  readonly start: number
  readonly end: number
}

type QueryToParseResult = Map<string, ParseResult>

export default class Analyzer {
  private queryToParseResult: QueryToParseResult

  public constructor() {
    this.queryToParseResult = new Map()
  }

  public analyze(query: string, schemaTables: SchemaTables = []): void {
    if (!query) {
      throw new EmptyQueryError()
    }

    const cachedResult = this.queryToParseResult.get(query)
    if (cachedResult) {
      this.analyzeResult(query, schemaTables, cachedResult)
      return
    }

    const result = parse(query)
    this.queryToParseResult.set(query, result)
    this.analyzeResult(query, schemaTables, result)
  }

  private analyzeResult(query: string, schemaTables: SchemaTables, result: ParseResult): void {
    const { error, data } = result

    if (error) {
      this.analyzeSyntax(error)
    }

    if (schemaTables.length) {
      this.analyzeSemantics(query, data.tables, schemaTables)
    }
  }

  public getParseResult(query: string): ParseResult {
    const result = this.queryToParseResult.get(query)
    if (result) {
      return result
    }
    return parse(query)
  }

  private analyzeSemantics(query: string, queryTables: QueryTables, schemaTables: SchemaTables): void {
    this.analyzeTables(query, queryTables, schemaTables)
  }

  private analyzeSyntax(error: Error): never {
    const { near, start, end } = this.parseSyntaxError(error.message)

    // `near` is not found, e.g. `SELECT * FROM`, `SELECT * FROM workspaces WHERE id =`
    if (!near) {
      throw new InvalidSyntaxError()
    }

    // `near` is a not valid keyword, e.g. sql`SELECT FRM`
    if (!keywords.includes(near)) {
      throw new InvalidKeywordError({
        keyword: near,
        start,
        end
      })
    }

    throw new InvalidSyntaxError()
  }

  private analyzeTables(query: string, queryTables: QueryTables, schemaTables: SchemaTables): void {
    queryTables.forEach(queryTable => {
      const { name } = queryTable

      // SQL parser returns "dual" as table name for expressions with "*"
      // https://github.com/xwb1989/sqlparser/blob/master/sql.y#L1672
      if (!name || name === 'dual') {
        return
      }

      const schemaTable = schemaTables.find(t => t.name === name)
      if (!schemaTable) {
        const position = this.getFirstPosition(query, name)
        if (!position) {
          return
        }

        throw new InvalidTableError({
          table: name,
          start: position.start,
          end: position.end
        })
      }

      this.analyzeColumns(query, queryTable, schemaTable)
    })
  }

  private analyzeColumns(query: string, queryTable: QueryTable, schemaTable: SchemaTable): void {
    const { name: tableName, columns: queryColumns } = queryTable

    queryColumns.forEach(queryColumn => {
      const { name: columnName } = queryColumn

      const schemaColumn = schemaTable.columns.find(c => c.name === columnName)
      if (schemaColumn) {
        this.analyzeColumnType(query, queryColumn, schemaColumn)
        return
      }

      const position = this.getFirstPosition(query, columnName)
      if (!position) {
        return
      }

      throw new InvalidColumnError({
        column: columnName,
        table: tableName,
        start: position.start,
        end: position.end
      })
    })
  }

  private analyzeColumnType(query: string, queryColumn: QueryColumn, schemaColumn: SchemaColumn) {
    const { name: columnName, operator, value, tsType } = queryColumn

    // Check for literal only columns.
    // e.g. sql`SELECT id FROM workspaces WHERE version = 1 AND slug = 'xxxxx' AND sso_is_forced = "false"`
    if (!operator || !tsType) {
      return
    }

    if (tsType === schemaColumn.tsType) {
      return
    }

    const predicate = tsType === 'string' ? `"${value}"` : value // special case for strings, TODO: support ''
    const pattern = `${columnName} ${operator} ${predicate}`
    const start = query.indexOf(pattern)

    // this currently handles scenarios like substitutions, where the following query:
    // SELECT * FROM workspaces WHERE id = ${id}
    // is replaced with:
    // SELECT * FROM workspaces WHERE id = "xxxx"
    // This will need to be updated when support for embedded expressions is added.
    if (start === -1) {
      return
    }

    throw new InvalidColumnValueError({
      expectedType: schemaColumn.tsType,
      receivedType: tsType,
      length: pattern.length,
      start: start + 1,
      end: start + predicate.length
    })
  }

  // Get the first matching position of whole word `target` in `text`.
  private getFirstPosition(text: string, target: string): Position | null {
    const indexes = findAllIndexes(target, text)

    for (let i = 0; i < indexes.length; i++) {
      const index = indexes[i]
      const wordWithOffset = getWordAtOffset(index, text)
      if (!wordWithOffset) {
        continue
      }

      if (wordWithOffset.word !== target) {
        continue
      }

      const start = index + 1

      return {
        end: start + target.length,
        start
      }
    }

    return null
  }

  private parseSyntaxError(message: string): SyntaxErrorData {
    let position: number | null = null
    let near: string | '' = ''

    const result = /syntax error at position (\d+) near '(.+)'/.exec(message)
    if (result) {
      position = Number(result[1])
      near = result[2]
    }

    const endPosition = Number(position)
    const startPosition = endPosition - near.length

    return {
      near,
      start: startPosition,
      end: endPosition
    }
  }
}
