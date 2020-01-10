interface TsMySqlPluginConfiguration {
  readonly tags: ReadonlyArray<string>
  readonly databaseUri?: string
}

const defaultConfiguration: TsMySqlPluginConfiguration = {
  tags: ['sql', 'SQL']
}

export class Configuration {
  private _tags = defaultConfiguration.tags
  private _databaseUri = ''
  private _pluginName = 'ts-mysql-plugin'

  public update(config: TsMySqlPluginConfiguration): void {
    this._tags = config.tags || defaultConfiguration.tags
    this._databaseUri = config.databaseUri || ''
  }

  public get pluginName(): string {
    return this._pluginName
  }

  public get tags(): ReadonlyArray<string> {
    return this._tags
  }

  public get databaseUri(): string {
    return this._databaseUri
  }
}
