import { SQL as sql } from 'sql-template-strings'

// Empty query.
sql``

/**
 * The following section is for keyword validation.
 */

// Valid keywords.
sql`SELECT * FROM workspaces`
sql`SELECT id FROM workspaces`
sql`SELECT id, name FROM workspaces`
sql`INSERT INTO workspaces (id) VALUES ("id")`
sql`INSERT INTO workspaces (id, name) VALUES ("id", "some-name-3")`
sql`SELECT s.slug FROM sources s LEFT JOIN workspaces w ON s.workspace_id = w.id WHERE s.workspace_id = 'foo'`

// Invalid keywords.
sql`SELEC`
sql`SELECT id FRM workspaces`
sql`SELECT s.slug FROM sources s LEFT JIN workspaces w ON s.workspace_id = w.id WHERE s.workspace_id = 'foo'`

/**
 * The following section is for table/column validation.
 */

// Valid tables/columns
sql`SELECT id FROM workspaces`
sql`SELECT id, name FROM workspaces`
// Invalid tables/columns
sql`SELECT id FROM worksp`
sql`SELECT id, nam FROM workspaces`
sql`SELECT name FROM workspaces WHERE nam = "foo"`
sql`SELECT s.slug FROM sources s LEFT JOIN workspaces w ON s.workspace_id = w.id WHERE s.workspace_i = 'foo'`

/**
 * The following section is for different statement types.
 */

//  Valid
sql`CREATE TABLE foo (id int)`
sql`CREATE TABLE workspaces (id integer)`
sql`USE ctlplane`
sql`SELECT * FROM sources WHERE JSON_TYPE(JSON_EXTRACT(labels, '$')) != 'NULL'`

// Invalid
sql`CREATE TABLE workspaces (id in)`
sql`CREATE TABLE workspaces (id integ)`
sql`US ctlplane`
sql`SELECT * FROM sources WHERE JSON_TYPE(JSON_EXTRACT(lbels, '$')) != 'NULL'`
const input = { workspaceId: '', allowedLabels: [] }
sql`
  SELECT labels FROM sources
  WHERE workspace_id = ${input.workspaceId}
  AND JSON_TYPE(JSON_EXTRACT(lbels, '$')) != 'NULL'`
sql`
  INSERT INTO allowed_labels (workspace_id, labels)
  VALUES (${input.workspaceId}, ${JSON.stringify(input.allowedLabels)})
  on dupicate key update labels = values(labels)`

/**
 * The following section is for type validation. It is broken up into: literals, variables, and special scenarios.
 *
 *  - All literal scenarios are encompassed by all primitive types in an embedded and unembedded format.
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
 * Literal undefined. TODO: fixme, undefined is not allowed.
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
 * Nested boolean variable.
 */

const nestedBooleanVariable = {
  foo: {
    bar: {
      baz: true
    }
  }
}

// Nested boolean embedded, success
sql`SELECT * FROM workspaces WHERE sso_is_forced = ${nestedBooleanVariable.foo.bar.baz}`
// Nested boolean embedded, failure
sql`SELECT * FROM workspaces WHERE created_at = ${nestedBooleanVariable.foo.bar.baz}`

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
 * Nested number variable.
 */

const nestedNumberVariable = {
  foo: {
    bar: {
      baz: 12345
    }
  }
}

// Nested number embedded, success
sql`SELECT * FROM workspaces WHERE version = ${nestedNumberVariable.foo.bar.baz}`
// Nested number embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${nestedNumberVariable.foo.bar.baz}`

/**
 * Variable string.
 */

const stringVariable = 'hello world'

// Variable string embedded, success
sql`SELECT * FROM workspaces WHERE id = ${stringVariable}`
// Variable string embedded, failure
sql`SELECT * FROM workspaces WHERE version = ${stringVariable}`

/**
 * Nested string variable.
 */

const nestedStringVariable = {
  foo: {
    bar: {
      baz: 'hello world'
    }
  }
}

// Nested string embedded, success
sql`SELECT * FROM workspaces WHERE id = ${nestedStringVariable.foo.bar.baz}`
// Nested string embedded, failure
sql`SELECT * FROM workspaces WHERE created_at = ${nestedStringVariable.foo.bar.baz}`

/**
 * Variable object. TODO: fixme
 */

const objectVariable = {}

// Variable object embedded, success
sql`SELECT * FROM workspaces WHERE features = ${JSON.stringify(objectVariable)}`
// Variable object embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${JSON.stringify(objectVariable)}`

/**
 * Nested object variable. TODO: fixme
 */

const nestedObjectVariable = {
  foo: {
    bar: {
      baz: {}
    }
  }
}

// Nested object embedded, success
sql`SELECT * FROM workspaces WHERE features = ${JSON.stringify(nestedObjectVariable.foo.bar.baz)}`
// Nested object embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${JSON.stringify(nestedObjectVariable.foo.bar.baz)}`

/**
 * Variable date.
 */

const dateVariable = new Date()

// Variable date embedded, success
sql`SELECT * FROM workspaces WHERE created_at = ${dateVariable}`
// Variable date embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${dateVariable}`

/**
 * Nested date variable.
 */

const nestedDateVariable = {
  foo: {
    bar: {
      baz: new Date()
    }
  }
}

// Nested date embedded, success
sql`SELECT * FROM workspaces WHERE created_at = ${nestedDateVariable.foo.bar.baz}`
// Nested date embedded, failure
sql`SELECT * FROM workspaces WHERE id = ${nestedDateVariable.foo.bar.baz}`

/**
 * Class.
 */

class TestClassInput {
  createdAt: Date
  workspaceId: string
}

function testClassInput(input: TestClassInput) {
  // success
  sql`SELECT * FROM workspaces WHERE id = ${input.workspaceId}`
  // failure
  sql`SELECT * FROM workspaces WHERE id = ${input.createdAt}`
}

testClassInput({
  createdAt: new Date(),
  workspaceId: 'some-workspace-id'
})

/**
 * Interface.
 */

interface TestInterfaceInput {
  createdAt: Date
  workspaceId: string
}

function testInterfaceInput(input: TestInterfaceInput) {
  // success
  sql`SELECT * FROM workspaces WHERE id = ${input.workspaceId}`
  // failure
  sql`SELECT * FROM workspaces WHERE id = ${input.createdAt}`
}

testInterfaceInput({
  createdAt: new Date(),
  workspaceId: 'some-workspace-id'
})
