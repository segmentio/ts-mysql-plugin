import { Logger } from 'typescript-template-language-service-decorator'
import { server } from 'typescript/lib/tsserverlibrary'
import { Configuration } from './configuration'

export default class ServiceLogger implements Logger {
  private readonly project?: server.Project
  private readonly config: Configuration

  public constructor(config: Configuration, project?: server.Project) {
    this.project = project
    this.config = config
  }

  public log(message: string): void {
    const payload = `[${this.config.pluginName}] ${message}`

    if (this.project) {
      this.project.projectService.logger.info(payload)
    } else {
      console.log(payload)
    }
  }
}
