import {
  decorateWithTemplateLanguageService as decorate,
  TemplateSettings
} from 'typescript-template-language-service-decorator'
import Typescript from 'typescript/lib/tsserverlibrary'
import MySqlLanguageService from './language-service'
import getSubstitutions from './lib/get-substitutions'
import Logger from './logger'

type TypescriptType = typeof Typescript

class MySqlPlugin {
  private readonly typescript: TypescriptType

  public constructor(typescript: TypescriptType) {
    this.typescript = typescript
  }

  public create({ languageService, project, config }: Typescript.server.PluginCreateInfo): Typescript.LanguageService {
    const templateSettings: TemplateSettings = {
      tags: ['sql', 'SQL'],
      enableForStringWithSubstitutions: true,
      getSubstitutions
    }
    const logger = new Logger(project)

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
