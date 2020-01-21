import Analyzer from '../'
import { TemplateContext } from 'typescript-template-language-service-decorator'
import {
  EmptyQueryError,
  SyntaxErrorGeneric,
  SyntaxErrorKeyword,
  SyntaxErrorNotKeyword,
  SemanticErrorBadTable,
  SemanticErrorBadColumn,
  SemanticErrorBadColumnValue
} from '../errors'
import { Tables } from '../../schema'

function getContext(query: string): TemplateContext {
  return {
    text: query,
    rawText: query
  } as TemplateContext
}

const analyzer = new Analyzer()

describe('Analyzer', () => {
  describe('Syntax Errors', () => {
    it('throws empty query error for empty queries', () => {
      const context = getContext('')
      expect(() => analyzer.analyze(context)).toThrow(EmptyQueryError)
    })

    it('throws generic syntax error', () => {
      const context = getContext('SELECT * FROM users WHERE')
      expect(() => analyzer.analyze(context)).toThrow(SyntaxErrorGeneric)
    })

    it('throws keyword syntax error', () => {
      const context = getContext('CREATE TABLE foo (id int boolean boolean)')
      expect(() => analyzer.analyze(context)).toThrow(SyntaxErrorKeyword)
    })

    it('throws not keyword syntax error', () => {
      const context = getContext('SELECT * FRM')
      expect(() => analyzer.analyze(context)).toThrow(SyntaxErrorNotKeyword)
    })
  })

  describe('Semantic Errors', () => {
    it('does not throw if there is no schema', () => {
      const context = getContext('SELECT * FROM users')
      expect(() => analyzer.analyze(context)).not.toThrow()
    })

    it('throws if received table does not exist in schema', () => {
      const context = getContext('SELECT * FROM users')
      const tables: Tables = [{ name: 'not-users', columns: [] }]
      expect(() => analyzer.analyze(context, tables)).toThrow(SemanticErrorBadTable)
    })

    it('throws if received column does not exist in schema', () => {
      const context = getContext('SELECT id FROM users')
      const tables: Tables = [{ name: 'users', columns: [] }]
      expect(() => analyzer.analyze(context, tables)).toThrow(SemanticErrorBadColumn)
    })

    it('throws if expected column type does not match received column type', () => {
      const context = getContext('SELECT id FROM users WHERE id = 1')
      const column = { name: 'id', tsType: 'string', sqlType: '', optional: false }
      const tables: Tables = [{ name: 'users', columns: [column] }]
      expect(() => analyzer.analyze(context, tables)).toThrow(SemanticErrorBadColumnValue)
    })

    it('does not throw if expected column type matches received column type', () => {
      const context = getContext('SELECT id FROM users WHERE id = "some-id"')
      const column = { name: 'id', tsType: 'string', sqlType: '', optional: false }
      const tables: Tables = [{ name: 'users', columns: [column] }]
      expect(() => analyzer.analyze(context, tables)).not.toThrow()
    })
  })
})
