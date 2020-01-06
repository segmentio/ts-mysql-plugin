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

class InvalidSyntaxError extends QueryError {
  constructor() {
    super()
    this.name = 'InvalidSyntaxError'
    this.code = 1002
  }
}

interface InvalidKeywordErrorData {
  readonly keyword: string
  readonly start: number
  readonly end: number
}

class InvalidKeywordError extends QueryError {
  data: InvalidKeywordErrorData

  constructor(data: InvalidKeywordErrorData) {
    super()
    this.name = 'InvalidKeywordError'
    this.data = data
    this.code = 1003
  }
}

interface InvalidTableErrorData {
  readonly table: string
  readonly start: number
  readonly end: number
}

class InvalidTableError extends QueryError {
  data: InvalidTableErrorData

  constructor(data: InvalidTableErrorData) {
    super()
    this.name = 'InvalidTableError'
    this.data = data
    this.code = 1004
  }
}

interface InvalidColumnErrorData {
  readonly column: string
  readonly table: string
  readonly start: number
  readonly end: number
}

class InvalidColumnError extends QueryError {
  data: InvalidColumnErrorData

  constructor(data: InvalidColumnErrorData) {
    super()
    this.name = 'InvalidColumnError'
    this.data = data
    this.code = 1005
  }
}

export { QueryError, EmptyQueryError, InvalidSyntaxError, InvalidKeywordError, InvalidTableError, InvalidColumnError }
