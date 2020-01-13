import { TemplateLanguageService, TemplateContext } from 'typescript-template-language-service-decorator'
import generateDocumentation from './lib/documentation/generate'
import { server } from 'typescript/lib/tsserverlibrary'
import {
  SymbolDisplayPart,
  ScriptElementKind,
  DiagnosticCategory,
  Diagnostic,
  QuickInfo,
  LineAndCharacter,
  CompletionEntry,
  CompletionInfo
} from 'typescript/lib/tsserverlibrary'
import smartTruncate from 'smart-truncate'
import markdownTable from 'markdown-table'
import { keywords } from './constants/keywords'
import getWordAtOffset from './lib/get-word-at-offset'
import { parseUri } from 'mysql-parse'
import autocorrect from './lib/autocorrect'
import Analyzer from './analyzer'
import { Configuration } from './configuration'
import Logger from './logger'
import Schema, { Tables, Table, Columns, Column } from './schema'

interface CreateDiagnosticInput {
  category: DiagnosticCategory
  message: string
  length: number
  start: number
  code: number
}

interface CreateQuickInfoInput {
  header?: SymbolDisplayPart[]
  docs?: SymbolDisplayPart[]
  startOffset: number
  wordAtHover: string
}

interface ResponseMessage {
  type: string
  event: string
}

const MAX_LENGTH = 30

function truncate(str: string): string {
  return smartTruncate(str, MAX_LENGTH)
}

function padding(amount: number): string {
  return '&nbsp;'.repeat(amount)
}

function createRow(column: Column): string[] {
  const pad = padding(5)
  return [
    truncate(column.name),
    pad,
    truncate(column.sqlType),
    pad,
    truncate(column.tsType),
    pad,
    String(column.optional)
  ]
}

interface MySqlLanguageServiceOptions {
  host: server.ServerHost
  config: Configuration
  logger: Logger
}

export default class MySqlLanguageService implements TemplateLanguageService {
  private readonly host: server.ServerHost
  private readonly analyzer: Analyzer
  private readonly logger: Logger
  private readonly databaseName?: string
  private readonly schema?: Schema
  private readonly config: Configuration

  public constructor({ host, logger, config }: MySqlLanguageServiceOptions) {
    this.analyzer = new Analyzer(logger)
    this.config = config
    this.logger = logger
    this.host = host

    const { databaseUri } = config
    if (databaseUri) {
      try {
        const { database: databaseName } = parseUri(databaseUri)
        this.databaseName = databaseName
        this.schema = new Schema({ databaseName, databaseUri, logger })
        this.schema.on('schemaLoaded', this.onSchemaLoaded.bind(this))
      } catch (e) {
        this.logger.log('Failed to parse provided database URI: ' + e)
      }
    }
  }

  // Send `schemaLoadingFinish` to client for testing purposes.
  private onSchemaLoaded(): void {
    const message = {
      type: 'event',
      event: 'schemaLoadingFinish'
    }
    this.sendResponse(message)
  }

  // Send a response to the client.
  private sendResponse(message: ResponseMessage): void {
    const json = JSON.stringify(message)
    const len = Buffer.byteLength(json, 'utf8')
    const formattedMessage = `Content-Length: ${1 + len}\r\n\r\n${json}${this.host.newLine}`
    this.host.write(formattedMessage)
  }

  private createDiagnostic(context: TemplateContext, input: CreateDiagnosticInput): Diagnostic {
    return {
      file: context.node.getSourceFile(),
      source: this.config.pluginName,
      messageText: input.message,
      category: input.category,
      length: input.length,
      start: input.start,
      code: input.code
    }
  }

  private createQuickInfo(input: CreateQuickInfoInput): QuickInfo {
    return {
      kind: ScriptElementKind.string,
      kindModifiers: '',
      textSpan: {
        start: input.startOffset,
        length: input.wordAtHover.length
      },
      displayParts: input.header,
      documentation: input.docs,
      tags: []
    }
  }

  public getQuickInfoAtPosition(context: TemplateContext, position: LineAndCharacter): QuickInfo | undefined {
    const offset = context.toOffset(position)
    const wordWithOffset = getWordAtOffset(offset, context.text)
    if (!wordWithOffset) {
      return
    }

    const { word, startOffset } = wordWithOffset
    const wordAtHover = word.toLowerCase()
    const docs: SymbolDisplayPart[] = []
    const header: SymbolDisplayPart[] = []

    if (keywords.includes(wordAtHover)) {
      const documentation = generateDocumentation(wordAtHover)
      docs.push({ kind: '', text: documentation })
    }

    const result = this.analyzer.getParseResult(context.text)
    if (!result || !result.statements || !this.schema) {
      return this.createQuickInfo({
        startOffset,
        wordAtHover,
        header,
        docs
      })
    }

    const pad = padding(5)
    const tableHeader = ['Name', pad, 'SQL Type', pad, 'TS Type', pad, 'Optional']
    const schemaTables = this.schema.getTables()

    const foundColumns = new Map()
    const foundTables = new Map()

    result.statements.forEach(statement => {
      const queryTables = statement.tables

      const queryTable = queryTables.find(t => t.name === word)
      if (queryTable) {
        const schemaTable = schemaTables.find(t => t.name === queryTable.name)
        // make sure we don't add twice
        if (schemaTable && !foundTables.get(schemaTable.name)) {
          foundTables.set(schemaTable.name, true)
          const rows = schemaTable.columns.map(column => createRow(column))
          docs.push({ kind: '', text: markdownTable([tableHeader, ...rows]) })
        }
      }

      let schemaColumn: Column | null = null

      for (const queryTable of queryTables) {
        const schemaTable = schemaTables.find(t => t.name === queryTable.name)
        if (!schemaTable) {
          continue
        }

        const column = schemaTable.columns.find(c => c.name === word)
        if (!column) {
          continue
        }

        // make sure we don't add twice
        const alreadyFound = foundColumns.get(`${schemaTable.name}:${column.name}`)
        if (!alreadyFound) {
          foundColumns.set(`${schemaTable.name}:${column.name}`, true)
          schemaColumn = column
        }
        break
      }

      if (schemaColumn) {
        const row = createRow(schemaColumn)
        docs.push({ kind: '', text: markdownTable([tableHeader, row]) })
      }
    })

    return this.createQuickInfo({
      startOffset,
      wordAtHover,
      header,
      docs
    })
  }

  public getCompletionsAtPosition(context: TemplateContext): CompletionInfo {
    const keywordEntries: CompletionEntry[] = keywords.map(
      (keyword: string): CompletionEntry => {
        return {
          name: keyword.toUpperCase(),
          kind: ScriptElementKind.keyword,
          kindModifiers: '',
          sortText: keyword
        }
      }
    )

    if (!this.schema) {
      return {
        entries: keywordEntries,
        isNewIdentifierLocation: false,
        isGlobalCompletion: false,
        isMemberCompletion: false
      }
    }

    const schemaTables = this.schema.getTables()
    const tableEntries = schemaTables.map(
      (table: Table): CompletionEntry => {
        return {
          name: table.name,
          kind: ScriptElementKind.classElement,
          kindModifiers: '',
          sortText: table.name
        }
      }
    )

    const result = this.analyzer.getParseResult(context.text)
    let columns: Columns = []

    if (result) {
      result.statements.forEach(statement => {
        const queryTables = statement.tables
        queryTables.forEach(queryTable => {
          const { name } = queryTable
          const schemaTable = schemaTables.find(t => t.name === name)
          if (schemaTable) {
            columns = columns.concat(schemaTable.columns)
          }
        })
      })
    }

    const columnEntries = columns.map(
      (column: Column): CompletionEntry => {
        return {
          name: column.name,
          kind: ScriptElementKind.memberVariableElement,
          kindModifiers: '',
          sortText: column.name
        }
      }
    )

    return {
      entries: tableEntries.concat(columnEntries).concat(keywordEntries),
      isNewIdentifierLocation: false,
      isGlobalCompletion: false,
      isMemberCompletion: false
    }
  }

  public getSemanticDiagnostics(context: TemplateContext): Diagnostic[] {
    this.logger.log('getSemanticDiagnostics: ')

    let tables: Tables = []
    if (this.schema) {
      tables = this.schema.getTables()
    }

    const diagnostics: Diagnostic[] = []

    try {
      this.analyzer.analyze(context, tables)
    } catch (error) {
      const { name, data } = error

      switch (name) {
        case 'EmptyQueryError':
          diagnostics.push(
            this.createDiagnostic(context, {
              message: 'Empty MySQL query.',
              category: DiagnosticCategory.Error,
              length: 2,
              start: -1, // special case to highlight enclosing backticks
              code: error.code
            })
          )
          break
        case 'SyntaxErrorGeneric':
          diagnostics.push(
            this.createDiagnostic(context, {
              message: 'MySQL Syntax Error.',
              category: DiagnosticCategory.Error,
              length: data.end - data.start,
              start: data.start,
              code: error.code
            })
          )
          break
        case 'SyntaxErrorKeyword':
          diagnostics.push(
            this.createDiagnostic(context, {
              message: `MySQL Syntax Error. The problem is near the word '${data.keyword}', which is a reserved keyword. Are you missing a semicolon? Did you forget to backtick a column name?`,
              category: DiagnosticCategory.Error,
              length: data.end - data.start,
              start: data.start - 1,
              code: error.code
            })
          )
          break
        case 'SyntaxErrorNotKeyword': {
          const word = data.unidentifiedWord
          const correction = this.getCorrection(word.toLowerCase(), keywords)
          const messageParts = [`MySQL Syntax Error. Unidentified word '${word}'.`]
          if (correction) {
            messageParts.push(` Did you mean '${correction.toUpperCase()}'?`)
          }

          diagnostics.push(
            this.createDiagnostic(context, {
              message: messageParts.join(''),
              category: DiagnosticCategory.Error,
              length: data.end - data.start,
              start: data.start - 1,
              code: error.code
            })
          )
          break
        }
        case 'SemanticErrorBadTable': {
          const tableNames = tables.map(t => t.name)
          const correction = this.getCorrection(data.table.toLowerCase(), tableNames)
          const messageParts = [`Table '${data.table}' does not exist in database '${this.databaseName}'.`]
          if (correction) {
            messageParts.push(` Did you mean '${correction}'?`)
          }

          diagnostics.push(
            this.createDiagnostic(context, {
              message: messageParts.join(''),
              category: DiagnosticCategory.Warning,
              length: data.table.length,
              start: data.start - 1,
              code: error.code
            })
          )
          break
        }
        case 'SemanticErrorBadColumn': {
          const table = tables.find(t => t.name === data.table)
          const columnNames = table?.columns.map(c => c.name) || []
          const correction = this.getCorrection(data.column.toLowerCase(), columnNames)
          const messageParts = [`Column '${data.column}' does not exist in table '${data.table}'.`]
          if (correction) {
            messageParts.push(` Did you mean '${correction}'?`)
          }

          diagnostics.push(
            this.createDiagnostic(context, {
              message: messageParts.join(''),
              category: DiagnosticCategory.Warning,
              length: data.column.length,
              start: data.start - 1,
              code: error.code
            })
          )
          break
        }
        case 'SemanticErrorBadColumnValue': {
          diagnostics.push(
            this.createDiagnostic(context, {
              message: `Type ${data.receivedType} is not assignable to type ${data.expectedType}`,
              category: DiagnosticCategory.Warning,
              length: data.length,
              start: data.start - 1,
              code: error.code
            })
          )
          break
        }
      }
    }

    return diagnostics
  }

  private getCorrection(near: string, keywords: string[]): string {
    const correction = autocorrect(near, keywords)
    if (!correction) {
      return ''
    }

    if (correction === near) {
      return ''
    }

    return correction
  }
}
