import {
  decorateWithTemplateLanguageService as decorate,
  TemplateSettings
} from 'typescript-template-language-service-decorator'
import Typescript from 'typescript/lib/tsserverlibrary'
import MySqlLanguageService from './language-service'
// import getSubstitutions from './lib/get-substitutions'
const { InTypeAlias, NoTruncation } = Typescript.TypeFormatFlags
import Logger from './logger'

type TypescriptType = typeof Typescript

class MySqlPlugin {
  private readonly typescript: TypescriptType

  public constructor(typescript: TypescriptType) {
    this.typescript = typescript
  }

  public create({ languageService, project, config }: Typescript.server.PluginCreateInfo): Typescript.LanguageService {
    const logger = new Logger(project)

    const checker = languageService.getProgram()!.getTypeChecker()

    const templateSettings: TemplateSettings = {
      tags: ['sql', 'SQL'],
      enableForStringWithSubstitutions: true,
      getSubstitutions: (contents: string, _, node: Typescript.TemplateExpression) => {
        const spans = getSpans(node)
        const parts: string[] = []
        let lastIndex = 0

        for (const span of spans) {
          parts.push(contents.slice(lastIndex, span.start))
          const type = checker.getTypeAtLocation(span.expression)
          const value = checker.typeToString(type, undefined, InTypeAlias | NoTruncation)
          parts.push(value)
          lastIndex = span.end
        }

        parts.push(contents.slice(lastIndex))

        return parts.join('')
      }
    }

    const service = new MySqlLanguageService({
      databaseUri: config.databaseUri,
      logger
    })

    const plugin = decorate(this.typescript, languageService, project, service, templateSettings, {
      logger
    })

    return plugin
  }
}

export = (modules: { typescript: TypescriptType }) => new MySqlPlugin(modules.typescript)

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
