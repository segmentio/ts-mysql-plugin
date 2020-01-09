import {
  decorateWithTemplateLanguageService as decorate,
  TemplateSettings
} from 'typescript-template-language-service-decorator'
import ts from 'typescript/lib/tsserverlibrary'
import MySqlLanguageService from './language-service'
const { InTypeAlias, NoTruncation } = ts.TypeFormatFlags
import Logger from './logger'

type TsType = typeof ts

class MySqlPlugin {
  private readonly typescript: TsType

  public constructor(typescript: TsType) {
    this.typescript = typescript
  }

  public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    const logger = new Logger(info.project)

    const templateSettings: TemplateSettings = {
      tags: ['sql', 'SQL'],
      enableForStringWithSubstitutions: true,
      getSubstitutions: (contents: string, _, node: ts.TemplateExpression) => {
        const checker = info.project
          .getLanguageService()
          .getProgram()
          ?.getTypeChecker()!

        const spans = getSpans(node)
        const parts: string[] = []
        let lastIndex = 0

        for (const span of spans) {
          parts.push(contents.slice(lastIndex, span.start))
          const expression = span.expression
          const value = getValueFromExpression(expression, checker, logger)
          parts.push(value)
          lastIndex = span.end
        }

        parts.push(contents.slice(lastIndex))

        return parts.join('')
      }
    }

    const service = new MySqlLanguageService({
      databaseUri: info.config.databaseUri,
      logger
    })

    const plugin = decorate(this.typescript, info.languageService, info.project, service, templateSettings, {
      logger
    })

    return plugin
  }
}

export = (modules: { typescript: TsType }) => new MySqlPlugin(modules.typescript)

function getSpans(node: ts.TemplateExpression) {
  const spans: Array<{ start: number; end: number; expression: ts.Expression }> = []
  const stringStart = node.getStart() + 1

  let nodeStart = node.head.end - stringStart - 2
  for (const templateSpan of node.templateSpans) {
    const literal = templateSpan.literal
    const start = literal.getStart() - stringStart + 1
    const expression = templateSpan.expression
    spans.push({ start: nodeStart, end: start, expression })
    nodeStart = literal.getEnd() - stringStart - 2
  }

  return spans
}

function getValueFromExpression(expression: ts.Expression, checker: ts.TypeChecker, logger: Logger): any {
  const locationType = checker.getTypeAtLocation(expression)
  const apparentType = checker.getApparentType(locationType)
  const value = checker.typeToString(locationType, expression, InTypeAlias | NoTruncation)
  const type = checker.typeToString(apparentType, expression, InTypeAlias | NoTruncation)

  logger.log('getValueFromExpression - raw: ' + expression.getText())
  logger.log('getValueFromExpression - type: ' + type)
  logger.log('getValueFromExpression - value: ' + value)

  switch (type) {
    case 'null':
      return value
    case 'String':
      // TODO: explain why this is needed.
      if (value === 'string') {
        return "'string'"
      }
      return value
    case 'Number':
    case 'Boolean':
      return value
    case 'Date':
      return `"${new Date().toISOString()}"`
  }
}
