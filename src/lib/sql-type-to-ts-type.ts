import { SqlDataType, TsDataType } from '../constants/data-types'

export default function sqlTypeToTsType(dataType: SqlDataType): TsDataType {
  switch (dataType) {
    case SqlDataType.CHAR:
    case SqlDataType.VARCHAR:
    case SqlDataType.TEXT:
    case SqlDataType.TINYTEXT:
    case SqlDataType.MEDIUMTEXT:
    case SqlDataType.LONGTEXT:
    case SqlDataType.TIME:
    case SqlDataType.GEOMETRY:
    case SqlDataType.SET:
    case SqlDataType.ENUM:
      return TsDataType.STRING
    case SqlDataType.INTEGER:
    case SqlDataType.INT:
    case SqlDataType.SMALLINT:
    case SqlDataType.MEDIUMINT:
    case SqlDataType.BIGINT:
    case SqlDataType.DOUBLE:
    case SqlDataType.DECIMAL:
    case SqlDataType.NUMERIC:
    case SqlDataType.FLOAT:
    case SqlDataType.YEAR:
      return TsDataType.NUMBER
    case SqlDataType.TINYINT:
      return TsDataType.BOOLEAN
    case SqlDataType.JSON:
      return TsDataType.OBJECT
    case SqlDataType.DATE:
    case SqlDataType.DATETIME:
    case SqlDataType.TIMESTAMP:
      return TsDataType.DATE
    case SqlDataType.TINYBLOB:
    case SqlDataType.MEDIUMBLOB:
    case SqlDataType.LONGBLOB:
    case SqlDataType.BLOB:
    case SqlDataType.BINARY:
    case SqlDataType.VARBINARY:
    case SqlDataType.BIT:
      return TsDataType.STRING // TODO: is this better as a buffer?
    default:
      return TsDataType.ANY
  }
}
