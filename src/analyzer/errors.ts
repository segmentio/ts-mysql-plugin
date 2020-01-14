class QueryError extends Error {
  name: string
  code: number

  constructor() {
    super()

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryError)
    }

    this.name = 'QueryError'
    this.code = 1000
  }
}

class EmptyQueryError extends QueryError {
  constructor() {
    super()
    this.name = 'EmptyQueryError'
    this.code = 1001
  }
}

interface SyntaxErrorGenericData {
  readonly start: number
  readonly end: number
}

class SyntaxErrorGeneric extends QueryError {
  data: SyntaxErrorGenericData

  constructor(data: SyntaxErrorGenericData) {
    super()
    this.name = 'SyntaxErrorGeneric'
    this.data = data
    this.code = 1002
  }
}

interface SyntaxErrorKeywordData {
  readonly keyword: string
  readonly start: number
  readonly end: number
}

class SyntaxErrorKeyword extends QueryError {
  data: SyntaxErrorKeywordData

  constructor(data: SyntaxErrorKeywordData) {
    super()
    this.name = 'SyntaxErrorKeyword'
    this.data = data
    this.code = 1003
  }
}

interface SyntaxErrorNotKeywordData {
  readonly unidentifiedWord: string
  readonly start: number
  readonly end: number
}

class SyntaxErrorNotKeyword extends QueryError {
  data: SyntaxErrorNotKeywordData

  constructor(data: SyntaxErrorNotKeywordData) {
    super()
    this.name = 'SyntaxErrorNotKeyword'
    this.data = data
    this.code = 1004
  }
}

interface SemanticErrorBadTableData {
  readonly table: string
  readonly start: number
  readonly end: number
}

class SemanticErrorBadTable extends QueryError {
  data: SemanticErrorBadTableData

  constructor(data: SemanticErrorBadTableData) {
    super()
    this.name = 'SemanticErrorBadTable'
    this.data = data
    this.code = 1005
  }
}

interface SemanticErrorBadColumnData {
  readonly column: string
  readonly table: string
  readonly start: number
  readonly end: number
}

class SemanticErrorBadColumn extends QueryError {
  data: SemanticErrorBadColumnData

  constructor(data: SemanticErrorBadColumnData) {
    super()
    this.name = 'SemanticErrorBadColumn'
    this.data = data
    this.code = 1006
  }
}

interface SemanticErrorBadColumnValueData {
  readonly expectedType: string
  readonly receivedType: string
  readonly length: number
  readonly start: number
  readonly end: number
}

class SemanticErrorBadColumnValue extends QueryError {
  data: SemanticErrorBadColumnValueData

  constructor(data: SemanticErrorBadColumnValueData) {
    super()
    this.name = 'SemanticErrorBadColumnValue'
    this.data = data
    this.code = 1007
  }
}

interface SemanticErrorColumnCountDoesNotMatchRowCountData {
  readonly length: number
  readonly start: number
  readonly end: number
}

class SemanticErrorColumnCountDoesNotMatchRowCount extends QueryError {
  data: SemanticErrorColumnCountDoesNotMatchRowCountData

  constructor(data: SemanticErrorColumnCountDoesNotMatchRowCountData) {
    super()
    this.name = 'SemanticErrorColumnCountDoesNotMatchRowCount'
    this.data = data
    this.code = 1008
  }
}

export {
  QueryError,
  EmptyQueryError,
  SyntaxErrorGeneric,
  SyntaxErrorKeyword,
  SyntaxErrorNotKeyword,
  SemanticErrorBadTable,
  SemanticErrorBadColumn,
  SemanticErrorBadColumnValue,
  SemanticErrorColumnCountDoesNotMatchRowCount
}
