import { Logger } from 'typescript-template-language-service-decorator'
import { server } from 'typescript/lib/tsserverlibrary'
import { pluginName } from './config'

export default class implements Logger {
  private readonly project: server.Project

  public constructor(project: server.Project) {
    this.project = project
  }

  public log(msg: string): void {
    this.project.projectService.logger.info(`[${pluginName}] ${msg}`)
  }
}
