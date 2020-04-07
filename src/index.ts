import {
  decorateWithTemplateLanguageService as decorate,
  TemplateSubstitutions,
  TemplateSettings
} from 'typescript-template-language-service-decorator'
import ts from 'typescript/lib/tsserverlibrary'
import MySqlLanguageService from './language-service'
import getTemplateSubstitutions from './lib/get-substitutions'
import { Configuration } from './configuration'
import Logger from './logger'

type TsType = typeof ts

class MySqlPlugin {
  private readonly typescript: TsType
  private config = new Configuration()

  public constructor(typescript: TsType) {
    this.typescript = typescript
  }

  public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    this.config.update(info.config)

    const logger = new Logger(this.config, info.project)
    const templateSettings = this.getTemplateSettings(this.config, info.project)
    const service = new MySqlLanguageService({
      host: info.serverHost,
      config: this.config,
      logger
    })

    const plugin = decorate(this.typescript, info.languageService, info.project, service, templateSettings, {
      logger
    })

    return plugin
  }

  public onConfigurationChanged(config: Configuration): void {
    this.config.update(config)
  }

  private getTemplateSettings(config: Configuration, project: ts.server.Project): TemplateSettings {
    return {
      get tags(): readonly string[] {
        return config.tags
      },
      enableForStringWithSubstitutions: true,
      getSubstitutions: (node: ts.TemplateExpression): TemplateSubstitutions => {
        const program = project.getLanguageService().getProgram()
        const checker = program?.getTypeChecker()
        return getTemplateSubstitutions(checker, node)
      }
    }
  }
}

export = (modules: { typescript: TsType }): MySqlPlugin => {
  return new MySqlPlugin(modules.typescript)
}
