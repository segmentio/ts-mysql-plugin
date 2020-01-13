import {
  EmptyQueryError,
  SyntaxErrorNotKeyword,
  SyntaxErrorGeneric,
  SyntaxErrorKeyword,
  SemanticErrorBadTable,
  SemanticErrorBadColumn,
  SemanticErrorBadColumnValue
} from './errors'
import { keywords } from '../constants/keywords'
import {
  parse,
  ParseResult,
  Statements,
  Statement,
  Table as QueryTable,
  Tables as QueryTables,
  TableColumn as QueryColumn,
  ParseResultError
} from '../lib/sql-parser'
import { Table as SchemaTable, Tables as SchemaTables, Column as SchemaColumn } from '../schema'
import getWordAtOffset from '../lib/get-word-at-offset'
import findAllIndexes from '../lib/find-all-indexes'
import Logger from '../logger'
import { TemplateContext } from 'typescript-template-language-service-decorator'

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
    this.logger.log('analyze()')

    if (!context.text) {
      throw new EmptyQueryError()
    }

    const cachedResult = this.queryToParseResult.get(context.text)
    if (cachedResult) {
      this.analyzeResult(context, schemaTables, cachedResult)
      return
    }

    this.logger.log('analyze() - Query going into parser: ' + context.text)
    const result = parse(context.text)
    this.queryToParseResult.set(context.text, result)
    this.analyzeResult(context, schemaTables, result)
  }

  private analyzeResult(context: TemplateContext, schemaTables: SchemaTables, result: ParseResult): void {
    const { error, statements } = result
    if (error) {
      this.analyzeSyntax(context, error)
    } else {
      this.analyzeSemantics(context, statements, schemaTables)
    }
  }

  public getParseResult(query: string): ParseResult {
    const result = this.queryToParseResult.get(query)
    if (result) {
      return result
    }
    return parse(query)
  }

  /**
   * Analyze the syntax error.
   *
   *   Note: there will always be a position of the error, but not always a `near` word.
   *   See: https://github.com/vitessio/vitess/blob/master/go/vt/sqlparser/token.go#L456
   *
   * @param context
   * @param error
   */
  private analyzeSyntax(context: TemplateContext, error: ParseResultError): never {
    this.logger.log('.analyzeSyntax()' + context.rawText)

    const { near, position } = error
    let word = near

    // parser could not identify a nearest word, so let's try to find one ourselves
    if (!word) {
      const wordAndRange = getWordAtOffset(position, context.rawText)
      if (wordAndRange) {
        // found a nearest word, continue
        word = wordAndRange.word
      } else {
        // could not find a nearest word
        throw new SyntaxErrorGeneric({
          start: position,
          end: position
        })
      }
    }

    // there will always be a nearest word here
    const end = position
    const start = position - word.length

    if (keywords.includes(word.toLowerCase())) {
      throw new SyntaxErrorKeyword({
        start,
        end,
        keyword: word
      })
    }

    throw new SyntaxErrorNotKeyword({
      start,
      end,
      unidentifiedWord: word
    })
  }

  private analyzeSemantics(context: TemplateContext, statements: Statements, schemaTables: SchemaTables): void {
    // cannot validate without schema
    if (!schemaTables.length) {
      return
    }

    statements.forEach((statement: Statement) => {
      if (statement.type === 'DDL') {
        return
      }
      this.analyzeTables(context, statement.tables, schemaTables)
    })
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
        const position = this.getFirstPosition(context.rawText, name)
        if (!position) {
          return
        }

        throw new SemanticErrorBadTable({
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

      const position = this.getFirstPosition(context.rawText, columnName)
      if (!position) {
        return
      }

      throw new SemanticErrorBadColumn({
        column: columnName,
        table: tableName,
        start: position.start,
        end: position.end
      })
    })
  }

  private analyzeColumnType(context: TemplateContext, queryColumn: QueryColumn, schemaColumn: SchemaColumn): void {
    const { name: columnName, operator, value, tsType, inType } = queryColumn

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
      pattern = new RegExp(`\`{0,1}${columnName}\`{0,1}\\s*${operator}\\s*(['"]+.+['"]+)?([$\{]+[\\S]+}+)?`)
    } else if (inType === 'list') {
      // e.g. `INSERT INTO workspaces (id) VALUES (1) => 1 is the value
      pattern = new RegExp(value)
    }

    // catch NULL or null
    if (tsType === 'null') {
      pattern = new RegExp(value, 'i')
    }

    // match against raw text because it contains the string with the variable name,
    // which means it will work with embedded expressions
    const match = pattern.exec(context.rawText)
    if (!match) {
      return
    }

    const start = match.index
    if (!start) {
      return
    }

    throw new SemanticErrorBadColumnValue({
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
}
