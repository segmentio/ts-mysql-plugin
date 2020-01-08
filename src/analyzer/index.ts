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
import Logger from '../logger'
import { TemplateContext } from 'typescript-template-language-service-decorator'

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
  private readonly logger: Logger

  public constructor(logger: Logger) {
    this.logger = logger
    this.queryToParseResult = new Map()
  }

  public analyze(context: TemplateContext, schemaTables: SchemaTables = []): void {
    this.logger.log('analyze() ' + context.text)

    if (!context.text) {
      throw new EmptyQueryError()
    }

    const cachedResult = this.queryToParseResult.get(context.text)
    if (cachedResult) {
      this.analyzeResult(context, schemaTables, cachedResult)
      return
    }

    const result = parse(context.text)
    this.queryToParseResult.set(context.text, result)
    this.analyzeResult(context, schemaTables, result)
  }

  private analyzeResult(context: TemplateContext, schemaTables: SchemaTables, result: ParseResult): void {
    const { error, data } = result

    if (error) {
      this.analyzeSyntax(error)
    }

    if (schemaTables.length) {
      this.analyzeSemantics(context, data.tables, schemaTables)
    }
  }

  public getParseResult(query: string): ParseResult {
    const result = this.queryToParseResult.get(query)
    if (result) {
      return result
    }
    return parse(query)
  }

  private analyzeSemantics(context: TemplateContext, queryTables: QueryTables, schemaTables: SchemaTables): void {
    this.analyzeTables(context, queryTables, schemaTables)
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

  private analyzeTables(context: TemplateContext, queryTables: QueryTables, schemaTables: SchemaTables): void {
    queryTables.forEach(queryTable => {
      const { name } = queryTable

      // SQL parser returns "dual" as table name for expressions with "*"
      // https://github.com/xwb1989/sqlparser/blob/master/sql.y#L1672
      if (!name || name === 'dual') {
        return
      }

      const schemaTable = schemaTables.find(t => t.name === name)
      if (!schemaTable) {
        const position = this.getFirstPosition(context.text, name)
        if (!position) {
          return
        }

        throw new InvalidTableError({
          table: name,
          start: position.start,
          end: position.end
        })
      }

      this.analyzeColumns(context, queryTable, schemaTable)
    })
  }

  private analyzeColumns(context: TemplateContext, queryTable: QueryTable, schemaTable: SchemaTable): void {
    const { name: tableName, columns: queryColumns } = queryTable

    queryColumns.forEach(queryColumn => {
      const { name: columnName } = queryColumn

      const schemaColumn = schemaTable.columns.find(c => c.name === columnName)
      if (schemaColumn) {
        this.analyzeColumnType(context, queryColumn, schemaColumn)
        return
      }

      const position = this.getFirstPosition(context.text, columnName)
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

  private analyzeColumnType(context: TemplateContext, queryColumn: QueryColumn, schemaColumn: SchemaColumn) {
    const { name: columnName, operator, value, tsType, inType } = queryColumn

    // Check for literal only columns.
    // e.g. sql`SELECT id FROM workspaces WHERE version = 1 AND slug = 'xxxxx' AND sso_is_forced = "false"`
    if (!tsType || !inType) {
      return
    }

    // type is correct
    if (tsType === schemaColumn.tsType) {
      return
    }

    // special case for null
    if (tsType === 'null' && schemaColumn.optional) {
      return
    }

    let pattern = new RegExp(value)

    // e.g. 'SELECT id from workspaces WHERE version = 1'
    // expression: version = 1, columnName: version, operator: =, value: 1
    // also matches against embedded expressions e.g. SELECT id from workspaces WHERE version = ${someVersion}
    if (inType === 'expression') {
      pattern = new RegExp(`\`{0,1}${columnName}\`{0,1}\\s*${operator}\\s*(['"]+.+['"]+)?([\$\{]+\\w+}+)?`)
    } else if (inType === 'list') {
      // e.g. `INSERT INTO workspaces (id) VALUES (1) => 1 is the value
      pattern = new RegExp(value)
    }

    // catch NULL or null, true or TRUE, false or FALSE, etc.
    if (tsType === 'null' || tsType === 'boolean') {
      pattern = new RegExp(value, 'i')
    }

    // match against raw text because it contains the string with the variable name,
    // which means it will work with embedded expressions
    const match = context.rawText.match(pattern)
    if (!match) {
      return
    }

    const start = match.index
    if (!start) {
      return
    }

    throw new InvalidColumnValueError({
      expectedType: schemaColumn.tsType,
      receivedType: tsType,
      length: match[0].length,
      start: start + 1,
      end: start + String(value).length // Cast null to string because null has no length property
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
