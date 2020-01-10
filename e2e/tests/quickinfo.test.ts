import { hover } from '../lib/editor'
import docs from '../../src/lib/documentation/generate'

describe('QuickInfo', () => {
  it('returns SQL quick info documentation', async () => {
    const quickInfo = await hover('sql`SELECT * FROM workspaces`', {
      offset: 16,
      line: 1
    })
    expect(quickInfo.documentation).toBe(docs('FROM'))
  })
})
