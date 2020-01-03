import { SQL as sql } from 'sql-template-strings'

// Valid.
sql`SELECT * FROM workspaces`
sql`SELECT id FROM workspaces`
sql`SELECT id, name FROM workspaces`
sql`SELECT id, name FROM workspaces WHERE name = "some-name-1"`
const name2 = 'some-name-2'
sql`SELECT id, name FROM workspaces WHERE name = ${name2}`
sql`INSERT INTO workspaces (id) VALUES (1)`
sql`INSERT INTO workspaces (id, name) VALUES (1, "some-name-3")`
const name4 = 'some-name-4'
sql`INSERT INTO workspaces (id, name) VALUES (1, ${name4})`
sql`
  SELECT s.slug
  FROM sources s
  LEFT JOIN workspaces w
  ON s.workspace_id = w.id
  WHERE s.workspace_id = 'foo'`

// Invalid.
sql`SELECT`
sql`SELECT id FRM workspaces`
sql`SELECT id, name FROM worksp`
sql`SELECT name FROM workspaces WHERE nam = "foo"`
sql`SELECT id, name FROM workspaces WHEE name = "foo"`
const name5 = 'some-name-5'
sql`SELECT id, name FROM workspaces WHERE name ${name5}`
sql`
  SELECT s.slug
  FROM sources s
  LEFT JIN workspaces w
  ON s.workspace_id = w.id
  WHERE s.workspace_id = 'foo'`
