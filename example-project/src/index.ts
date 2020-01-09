import { SQL as sql } from 'sql-template-strings'

/**
 * This section serves as a quick gut check for valid/invalid queries. More comprehensive scenarios follow it.
 */

// Valid queries.
sql`SELECT * FROM workspaces`
sql`SELECT id FROM workspaces`
sql`SELECT id, name FROM workspaces`
sql`INSERT INTO workspaces (id) VALUES ("id")`
sql`INSERT INTO workspaces (id, name) VALUES ("id", "some-name-3")`
sql`SELECT s.slug FROM sources s LEFT JOIN workspaces w ON s.workspace_id = w.id WHERE s.workspace_id = 'foo'`

// Invalid queries.
sql``
sql`SELECT`
sql`SELECT id FRM workspaces`
sql`SELECT id, name FROM worksp`
sql`SELECT name FROM workspaces WHERE nam = "foo"`
sql`SELECT s.slug FROM sources s LEFT JIN workspaces w ON s.workspace_id = w.id WHERE s.workspace_id = 'foo'`
sql`SELECT s.slug FROM sources s LEFT JOIN workspaces w ON s.workspace_id = w.id WHERE s.workspace_i = 'foo'`

/**
 * Literals: all literal scenarios are encompassed by all primitive types in either an embedded or unembedded format.
 */

/**
 * Literal boolean.
 */

// Literal boolean embedded, success
sql`SELECT * FROM workspaces WHERE sso_is_forced = ${true}`
// Literal boolean embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${true}`
// Literal boolean, success
sql`SELECT * FROM workspaces WHERE sso_is_forced = true`
// Literal boolean, failure
sql`SELECT * FROM workspaces WHERE id = true`

/**
 * Literal null.
 */

// Literal null embedded, success
sql`SELECT * FROM workspaces WHERE version = ${null}`
// Literal null embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${null}`
// Literal null, success
sql`SELECT * FROM workspaces WHERE version = null`
// Literal null, failure
sql`SELECT * FROM workspaces WHERE id = null`

/**
 * Literal undefined. TODO: fixme
 */

// Literal undefined embedded, success
sql`SELECT * FROM workspaces WHERE version = ${undefined}`
// Literal undefined embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${undefined}`
// Literal undefined, success
sql`SELECT * FROM workspaces WHERE version = undefined`
// Literal undefined, failure
sql`SELECT * FROM workspaces WHERE id = undefined`

/**
 * Literal number.
 */

// Literal number embedded, success
sql`SELECT * FROM workspaces WHERE version = ${1}`
// Literal number embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${1}`
// Literal number, success
sql`SELECT * FROM workspaces WHERE version = 1`
// Literal number, failure
sql`SELECT * FROM workspaces WHERE id = 1`

/**
 * Literal string.
 */

// Literal string embedded, success
sql`SELECT * FROM workspaces WHERE id = ${'hello world'}`
// Literal string embedded, failure
sql`SELECT * FROM workspaces WHERE version = ${'hello world'}`
// Literal string, success
sql`SELECT * FROM workspaces WHERE id = 'hello world'`
// Literal string, failure
sql`SELECT * FROM workspaces WHERE version = 'hello world'`

/**
 * Literal object.
 */

// Literal object embedded, success
sql`SELECT * FROM workspaces WHERE features = ${'{}'}`
// Literal object embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${'{}'}`
// Literal object, success
sql`SELECT * FROM workspaces WHERE features = '{}'`
// Literal object, failure
sql`SELECT * FROM workspaces WHERE id = '{}'`

/**
 * Literal date.
 */

// Literal date embedded, success
sql`SELECT * FROM workspaces WHERE created_at = ${new Date()}`
// Literal date embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${new Date()}`
// Literal date, success
sql`SELECT * FROM workspaces WHERE created_at = '2020-01-09T03:27:43.663Z'`
// Literal date, failure
sql`SELECT * FROM workspaces WHERE id = '2020-01-09T03:27:43.663Z'`

/**
 * Variables: all variable scenarios are encompassed by all primitive types represented in a variable an embedded format.
 */

/**
 * Variable boolean.
 */

const booleanVariable = true

// Variable boolean embedded, success
sql`SELECT * FROM workspaces WHERE sso_is_forced = ${booleanVariable}`
// Variable boolean embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${booleanVariable}`

/**
 * Variable null. TODO: fixme
 */

const nullVariable = null

// Variable null embedded, success
sql`SELECT * FROM workspaces WHERE version = ${nullVariable}`
// Variable null embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${nullVariable}`

/**
 * Variable undefined. TODO: fixme
 */

const undefinedVariable = undefined

// Variable undefined embedded, success
sql`SELECT * FROM workspaces WHERE version = ${undefinedVariable}`
// Variable undefined embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${undefinedVariable}`

/**
 * Variable number.
 */

const numberVariable = 12345

// Variable number embedded, success
sql`SELECT * FROM workspaces WHERE version = ${numberVariable}`
// Variable number embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${numberVariable}`

/**
 * Variable string.
 */

const stringVariable = 'hello world'

// Variable string embedded, success
sql`SELECT * FROM workspaces WHERE id = ${stringVariable}`
// Variable string embedded, failure
sql`SELECT * FROM workspaces WHERE version = ${stringVariable}`

/**
 * Variable object. TODO: fixme
 */

const objectVariable = {}

// Variable object embedded, success
sql`SELECT * FROM workspaces WHERE features = ${JSON.stringify(objectVariable)}`
// Variable object embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${JSON.stringify(objectVariable)}`

/**
 * Variable date.
 */

const dateVariable = new Date()

// Variable date embedded, success
sql`SELECT * FROM workspaces WHERE created_at = ${dateVariable}`
// Variable date embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${dateVariable}`

/**
 * Nested variable.
 */

const nestedVariable = {
  foo: {
    bar: {
      baz: new Date()
    }
  }
}

// Variable object embedded, success
sql`SELECT * FROM workspaces WHERE created_at = ${nestedVariable.foo.bar.baz}`
// Variable object embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${nestedVariable.foo.bar.baz}`
