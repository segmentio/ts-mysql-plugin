import { TemplateLanguageService, TemplateContext } from 'typescript-template-language-service-decorator'
import {
  server,
  ScriptElementKind,
  Diagnostic,
  QuickInfo,
  LineAndCharacter,
  CompletionEntry,
  CompletionInfo
} from 'typescript/lib/tsserverlibrary'
import { MySQLAutocomplete } from 'ts-mysql-autocomplete'
import { MySQLSchema, Schema } from 'ts-mysql-schema'
import { MySQLAnalyzer } from 'ts-mysql-analyzer'
import MySQLParser, {
  ReferenceType,
  TableReference,
  ColumnReference,
  KeywordReference,
  FunctionReference
} from 'ts-mysql-parser'
import { Configuration } from './configuration'
import Logger from './logger'
import { generateDocumentation } from './lib/documentation/generate'
import { createMarkdownTable } from './lib/create-markdown-table'
import { sendHostMessage } from './lib/send-host-message'
import { mapSeverity } from './lib/map-severity'
import { getKind } from './lib/get-kind'

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

  private onSchemaLoaded(): void {
    if (process.env.NODE_ENV !== 'test') {
      return
    }
    sendHostMessage(this.host, {
      event: 'schemaLoadingFinish',
      type: 'event'
    })
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

    const schemaTables = this.schema?.tables || []

    if (type === ReferenceType.TableRef) {
      const reference = node as TableReference
      const schemaTable = schemaTables.find(t => t.name === reference.table)
      if (schemaTable) {
        const table = createMarkdownTable(schemaTable.columns)
        return this.createQuickInfo(start, schemaTable.name, table)
      }
    }

    if (type === ReferenceType.ColumnRef) {
      const reference = node as ColumnReference
      const schemaTable = schemaTables.find(t => t.name === reference.tableReference?.table)
      const schemaColumn = schemaTable?.columns.find(c => c.name === reference.column)
      if (!schemaColumn) {
        return
      }
      const table = createMarkdownTable([schemaColumn])
      return this.createQuickInfo(start, schemaColumn.name, table)
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
