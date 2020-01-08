import { SQL as sql } from 'sql-template-strings'

// Valid.
sql`SELECT * FROM workspaces`
sql`SELECT id FROM workspaces`
sql`SELECT id, name FROM workspaces`
sql`SELECT id, name FROM workspaces WHERE name = "some-name-1"`
const name2 = 'some-name-2'
sql`SELECT id, name FROM workspaces WHERE name = ${name2}`
sql`INSERT INTO workspaces (id) VALUES ("id")`
sql`INSERT INTO workspaces (id, name) VALUES ("id", "some-name-3")`
const name4 = 'some-name-4'
sql`INSERT INTO workspaces (id, name) VALUES ("id", ${name4})`
sql`
  SELECT s.slug
  FROM sources s
  LEFT JOIN workspaces w
  ON s.workspace_id = w.id
  WHERE s.workspace_id = 'foo'`
sql`
  SELECT id FROM workspaces
  WHERE version = 1
  AND slug = "some-slug"
  AND sso_is_forced = false`

const slug = 1
sql`
  SELECT id FROM workspaces
  WHERE version = ${slug}
  AND slug = "slug"
  AND sso_is_forced = false`

// Invalid.
sql``
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

sql`
  SELECT s.slug
  FROM sources s
  LEFT JOIN workspaces w
  ON s.workspace_id = w.id
  WHERE s.workspace_i = 'foo'`

sql`
  SELECT id FROM workspaces
  WHERE version = "some-version"
  AND slug = "some-slug"
  AND sso_is_forced = false`

sql`
  SELECT id FROM workspaces
  WHERE version = 1
  AND slug = false
  AND sso_is_forced = false`

sql`
  SELECT id FROM workspaces
  WHERE version = 1
  AND slug = "some-slug"
  AND sso_is_forced = "false"`

sql`INSERT INTO workspaces (id, slug) VALUES ("sdkfj", FALSE)`

sql`INSERT INTO workspaces (id, name, version) VALUES ("id", "name", "some-version")`
