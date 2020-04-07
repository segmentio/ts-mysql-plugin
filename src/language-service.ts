import { TemplateLanguageService, TemplateContext } from 'typescript-template-language-service-decorator'
import generateDocumentation from './lib/documentation/generate'
import { server } from 'typescript/lib/tsserverlibrary'
import {
  ScriptElementKind,
  Diagnostic,
  QuickInfo,
  LineAndCharacter,
  CompletionEntry,
  CompletionInfo
} from 'typescript/lib/tsserverlibrary'
import smartTruncate from 'smart-truncate'
import markdownTable from 'markdown-table'
import { Configuration } from './configuration'
import Logger from './logger'
import { MySQLAutocomplete } from 'ts-mysql-autocomplete'
import { MySQLSchema, Schema, SchemaColumn } from 'ts-mysql-schema'
import { mapSeverity } from './lib/map-severity'
import { MySQLAnalyzer } from 'ts-mysql-analyzer'
import MySQLParser, {
  ReferenceType,
  TableReference,
  ColumnReference,
  KeywordReference,
  FunctionReference
} from 'ts-mysql-parser'

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

function createRow(column: SchemaColumn): string[] {
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

function getKind(type: 'keyword' | 'table' | 'column'): ScriptElementKind {
  switch (type) {
    case 'keyword':
      return ScriptElementKind.keyword
    case 'table':
      return ScriptElementKind.classElement
    case 'column':
      return ScriptElementKind.memberVariableElement
  }
}

interface MySqlLanguageServiceOptions {
  host: server.ServerHost
  config: Configuration
  logger: Logger
}

export default class MySqlLanguageService implements TemplateLanguageService {
  private readonly host: server.ServerHost
  private readonly logger: Logger
  private readonly config: Configuration
  private autocompleter: MySQLAutocomplete
  private analyzer: MySQLAnalyzer
  private schema?: Schema

  public constructor({ host, logger, config }: MySqlLanguageServiceOptions) {
    this.config = config
    this.logger = logger
    this.host = host

    const parserOptions = {
      version: this.config.mySQLVersion
    }

    this.autocompleter = new MySQLAutocomplete({ parserOptions })
    this.analyzer = new MySQLAnalyzer({ parserOptions })

    const { databaseUri } = config
    if (!databaseUri) {
      return
    }

    const mySQLSchema = new MySQLSchema({ uri: databaseUri })
    mySQLSchema
      .getSchema()
      .then(schema => {
        this.schema = schema
        this.autocompleter = new MySQLAutocomplete({ parserOptions, schema, uppercaseKeywords: true })
        this.analyzer = new MySQLAnalyzer({ parserOptions, schema })
        this.onSchemaLoaded()
      })
      .catch(err => {
        this.logger.log('Failed to get schema: ' + err)
      })
  }

  // For testing purposes, tell client the schema has loaded
  private onSchemaLoaded(): void {
    const message = {
      type: 'event',
      event: 'schemaLoadingFinish'
    }
    this.sendResponse(message)
  }

  // For testing purposes, send response to client
  private sendResponse(message: ResponseMessage): void {
    const json = JSON.stringify(message)
    const len = Buffer.byteLength(json, 'utf8')
    const formattedMessage = `Content-Length: ${1 + len}\r\n\r\n${json}${this.host.newLine}`
    this.host.write(formattedMessage)
  }

  private createQuickInfo(start: number, text: string, docs: string): QuickInfo {
    return {
      kind: ScriptElementKind.string,
      kindModifiers: '',
      textSpan: {
        start,
        length: text.length
      },
      displayParts: [],
      documentation: [
        {
          kind: '',
          text: docs
        }
      ],
      tags: []
    }
  }

  private hasFileIgnoreComment(context: TemplateContext): boolean {
    const contents = this.host.readFile(context.fileName)
    if (!contents) {
      return false
    }

    const firstLine = contents.split('\n')[0]
    if (firstLine.includes('@ts-mysql-plugin ignore')) {
      return true
    }

    return false
  }

  public getQuickInfoAtPosition(context: TemplateContext, position: LineAndCharacter): QuickInfo | undefined {
    if (this.hasFileIgnoreComment(context)) {
      return
    }

    const offset = context.toOffset(position)
    const parser = new MySQLParser({ version: this.config.mySQLVersion })
    const statements = parser.splitStatements(context.text)

    const statement = parser.getStatementAtOffset(statements, offset)
    if (!statement) {
      return
    }

    const result = parser.parse(statement.text)

    const node = parser.getNodeAtOffset(result, offset - statement.start)
    if (!node) {
      return
    }

    const { start: nodeStart, type } = node
    const start = statement.start + nodeStart

    if (type === ReferenceType.KeywordRef) {
      const reference = node as KeywordReference
      const keyword = reference.keyword
      return this.createQuickInfo(start, keyword, generateDocumentation(keyword, 'keyword'))
    }

    if (type === ReferenceType.FunctionRef) {
      const reference = node as FunctionReference
      const fn = reference.function
      return this.createQuickInfo(start, fn, generateDocumentation(fn, 'function'))
    }

    const pad = padding(5)
    const tableHeader = ['Name', pad, 'SQL Type', pad, 'TS Type', pad, 'Optional']
    const schemaTables = this.schema?.tables || []

    if (type === ReferenceType.TableRef) {
      const reference = node as TableReference
      const schemaTable = schemaTables.find(t => t.name === reference.table)
      if (schemaTable) {
        const rows = schemaTable.columns.map(column => createRow(column))
        return this.createQuickInfo(start, schemaTable.name, markdownTable([tableHeader, ...rows]))
      }
    }

    if (type === ReferenceType.ColumnRef) {
      const reference = node as ColumnReference
      const schemaTable = schemaTables.find(t => t.name === reference.tableReference?.table)
      const schemaColumn = schemaTable?.columns.find(c => c.name === reference.column)
      if (!schemaColumn) {
        return
      }
      return this.createQuickInfo(start, schemaColumn.name, markdownTable([tableHeader, createRow(schemaColumn)]))
    }
  }

  public getCompletionsAtPosition(context: TemplateContext, position: LineAndCharacter): CompletionInfo {
    const completionInfo: CompletionInfo = {
      entries: [],
      isNewIdentifierLocation: false,
      isGlobalCompletion: false,
      isMemberCompletion: false
    }

    if (this.hasFileIgnoreComment(context)) {
      return completionInfo
    }

    const offset = context.toOffset(position)
    const parser = new MySQLParser({ version: this.config.mySQLVersion })
    const statements = parser.splitStatements(context.text)
    const statement = parser.getStatementAtOffset(statements, offset)
    if (!statement) {
      return completionInfo
    }

    const candidates = this.autocompleter.autocomplete(statement.text, offset - statement.start)

    completionInfo.entries = candidates.map(
      ({ text, type }): CompletionEntry => {
        return {
          name: text,
          kind: getKind(type),
          kindModifiers: '',
          sortText: text
        }
      }
    )

    return completionInfo
  }

  public getSemanticDiagnostics(context: TemplateContext): Diagnostic[] {
    if (this.hasFileIgnoreComment(context)) {
      return []
    }

    const diagnostics = this.analyzer.analyze(context.text) || []

    return diagnostics.map(diagnostic => {
      const substitution = context.getSubstitution(diagnostic.start)
      const stop = substitution ? substitution.oldStop : diagnostic.stop + 1
      let start = diagnostic.start
      let length = stop - start

      // special case to highlight enclosing backticks
      if (!context.text) {
        start = -1
        length = 2
      }

      return {
        file: context.node.getSourceFile(),
        source: this.config.pluginName,
        messageText: diagnostic.message,
        category: mapSeverity(diagnostic.severity),
        code: diagnostic.code,
        length,
        start
      }
    })
  }
}
