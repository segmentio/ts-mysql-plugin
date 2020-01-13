import sqlTypeToTsType from './lib/sql-type-to-ts-type'
import { Connection, createConnection, QueryError } from 'mysql2'
import { SqlDataType } from './constants/data-types'
import Logger from './logger'
import { EventEmitter } from 'events'

export type Tables = Table[]
export type Columns = Column[]

export interface Table {
  readonly name: string
  readonly columns: Columns
}

export interface Column {
  readonly name: string
  readonly tsType: string
  readonly sqlType: string
  readonly optional: boolean
}

interface SchemaOptions {
  readonly databaseName: string
  readonly databaseUri: string
  readonly logger: Logger
}

export default class Schema extends EventEmitter {
  private readonly connection?: Connection
  private readonly databaseName?: string
  private readonly logger: Logger
  public tables: Tables = []

  public constructor({ databaseName, databaseUri, logger }: SchemaOptions) {
    super()

    this.logger = logger

    if (!databaseUri) {
      return
    }

    this.databaseName = databaseName
    this.connection = createConnection({ uri: databaseUri })
    this.start()
  }

  private start(): void {
    this.logger.log('Started getting schema...')
    // do not block other plugin features while loading schema
    this.queryTables()
      .then(tables => {
        this.tables = tables
        this.emit('schemaLoaded')
      })
      .catch(error => {
        if (error) {
          throw error
        }
      })
  }

  private async queryTables(): Promise<Tables> {
    const results = await this.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.columns WHERE table_schema = '${this.databaseName}' GROUP BY table_name`
    )
    const names = results.map(result => result.table_name)
    const tables = names.map(async name => {
      return {
        name,
        columns: await this.queryColumns(name)
      }
    })

    return Promise.all(tables)
  }

  private async queryColumns(name: string): Promise<Columns> {
    const columns = await this.query<{
      column_name: string
      data_type: SqlDataType
      is_nullable: string
    }>(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = '${name}' 
       AND table_schema = '${this.databaseName}'`
    )

    return columns.map(column => {
      return {
        name: column.column_name,
        tsType: sqlTypeToTsType(column.data_type),
        sqlType: column.data_type,
        optional: column.is_nullable === 'YES'
      }
    })
  }

  private query<T>(sql: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.connection?.query(sql, (error: QueryError, results: Array<T>) => {
        if (error) {
          return reject(error)
        }
        return resolve(results)
      })
    })
  }

  public getTables(): Tables {
    return this.tables
  }
}
