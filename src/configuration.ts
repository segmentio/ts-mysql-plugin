interface TsMySqlPluginConfiguration {
  readonly tags: ReadonlyArray<string>
  readonly databaseUri?: string
  readonly mySQLVersion: string
}

const defaultConfiguration: TsMySqlPluginConfiguration = {
  tags: ['sql', 'SQL'],
  mySQLVersion: '5.7.12'
}

export class Configuration {
  private _tags = defaultConfiguration.tags
  private _mySQLVersion = defaultConfiguration.mySQLVersion
  private _databaseUri = ''
  private _pluginName = 'ts-mysql-plugin'

  public update(config: TsMySqlPluginConfiguration): void {
    this._tags = config.tags || defaultConfiguration.tags
    this._databaseUri = config.databaseUri || ''
    this._mySQLVersion = config.mySQLVersion || defaultConfiguration.mySQLVersion
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

  public get mySQLVersion(): string {
    return this._mySQLVersion
  }
}
