import {
  decorateWithTemplateLanguageService as decorate,
  TemplateSettings
} from 'typescript-template-language-service-decorator'
import ts from 'typescript/lib/tsserverlibrary'
import MySqlLanguageService from './language-service'
import getValueFromExpression from './lib/get-value-from-expression'
import getSpans from './lib/get-spans'
import Logger from './logger'

type TsType = typeof ts

class MySqlPlugin {
  private readonly typescript: TsType

  public constructor(typescript: TsType) {
    this.typescript = typescript
  }

  public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    const logger = new Logger(info.project)

    const { tags = ['sql', 'SQL'], databaseUri } = info.config

    const templateSettings: TemplateSettings = {
      tags,
      enableForStringWithSubstitutions: true,
      getSubstitutions: (contents: string, _, node: ts.TemplateExpression) => {
        const program = info.project.getLanguageService().getProgram()
        const checker = program?.getTypeChecker()
        const spans = getSpans(node)
        const parts: string[] = []
        let lastIndex = 0

        for (const span of spans) {
          parts.push(contents.slice(lastIndex, span.start))
          const expression = span.expression

          if (checker) {
            const value = getValueFromExpression(expression, checker, logger)
            parts.push(value)
          } else {
            const value = 'x'.repeat(span.end - span.start - 2)
            parts.push(`'${value}'`)
          }

          lastIndex = span.end
        }

        parts.push(contents.slice(lastIndex))

        return parts.join('')
      }
    }

    const service = new MySqlLanguageService({
      databaseUri,
      logger
    })

    const plugin = decorate(this.typescript, info.languageService, info.project, service, templateSettings, {
      logger
    })

    return plugin
  }
}

export = (modules: { typescript: TsType }): MySqlPlugin => {
  return new MySqlPlugin(modules.typescript)
}
