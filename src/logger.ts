import { Logger } from 'typescript-template-language-service-decorator'
import { server } from 'typescript/lib/tsserverlibrary'
import { Configuration } from './configuration'

export default class ServiceLogger implements Logger {
  private readonly project: server.Project
  private readonly config: Configuration

  public constructor(project: server.Project, config: Configuration) {
    this.project = project
    this.config = config
  }

  public log(message: string): void {
    this.project.projectService.logger.info(`[${this.config.pluginName}] ${message}`)
  }
}
