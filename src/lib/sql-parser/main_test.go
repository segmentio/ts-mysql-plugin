package main

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"vitess.io/vitess/go/vt/sqlparser"
)

// TestGetTables ensures that it works.
func TestGetTables(t *testing.T) {
	testcases := []struct {
		in  string
		out Tables
	}{{
		in: "SELECT w.id, s.slug FROM workspaces w INNER JOIN sources s ON s.workspace_id = w.id",
		out: []Table{
			Table{
				Name:  "workspaces",
				Alias: "w",
				Columns: []TableColumn{
					TableColumn{
						Name: "id",
					},
				},
			},
			Table{
				Name:  "sources",
				Alias: "s",
				Columns: []TableColumn{
					TableColumn{
						Name: "slug",
					},
					TableColumn{
						Name: "workspace_id",
					},
				},
			},
		},
	}, {
		in: "INSERT INTO allowed_labels (id, workspace_id, labels) VALUES ('some-id', 123, false)",
		out: []Table{
			Table{
				Name:  "allowed_labels",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{
						Name: "id",
						InType: "list",
						Value: "some-id",
						TsType: "string",
					},
					TableColumn{
						Name: "workspace_id",
						InType: "list",
						Value: 123,
						TsType: "number",
					},
					TableColumn{
						Name: "labels",
						InType: "list",
						Value: false,
						TsType: "boolean",
					},
				},
			},
		},
	}, {
		in: "CREATE TABLE foo (id int, slug varbinary(10))",
		out: []Table{
			Table{
				Name:    "foo",
				Alias:   "",
				Columns: []TableColumn{},
			},
		},
	}, {
		in: "SELECT id FROM workspaces WHERE version = 332 AND slug = 'xxxxx' AND isForced = false",
		out: []Table{
			Table{
				Name:  "workspaces",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{
						Name: "id",
					},
					TableColumn{
						Name: "version",
						InType: "expression",
						TsType: "number",
						Value: 332,
						Operator: "=",
					},
					TableColumn{
						Name: "slug",
						InType: "expression",
						TsType: "string",
						Value: "xxxxx",
						Operator: "=",
					},
					TableColumn{
						Name: "isForced",
						InType: "expression",
						TsType: "boolean",
						Value: false,
						Operator: "=",
					},
				},
			},
		},
	}, {
		in: "SELECT id FROM workspaces",
		out: []Table{
			Table{
				Name:  "workspaces",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{
						Name: "id",
					},
				},
			},
		},
	}, {
		in: "SELECT id FROM workspaces WHERE version = NULL",
		out: []Table{
			Table{
				Name:  "workspaces",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{
						Name: "id",
					},
					TableColumn{
						Name: "version",
						InType: "expression",
						TsType: "null",
						Value: nil,
						Operator: "=",
					},
				},
			},
		},
	}, {
		in: "SELECT id FROM workspaces WHERE created_at = '2020-01-09T00:57:29.965Z'",
		out: []Table{
			Table{
				Name:  "workspaces",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{
						Name: "id",
					},
					TableColumn{
						Name: "created_at",
						InType: "expression",
						TsType: "date",
						Value: "2020-01-09T00:57:29.965Z",
						Operator: "=",
					},
				},
			},
		},
	}, {
		in: "SELECT id FROM workspaces WHERE features = '{}'",
		out: []Table{
			Table{
				Name:  "workspaces",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{
						Name: "id",
					},
					TableColumn{
						Name: "features",
						InType: "expression",
						TsType: "object",
						Value: "{}",
						Operator: "=",
					},
				},
			},
		},
	}}

	for _, tc := range testcases {
		tree, err := sqlparser.ParseStrictDDL(tc.in)
		if err != nil {
			t.Error(err)
			continue
		}
		out := GetTables(tree)
		if cmp.Equal(out, tc.out) == false {
			t.Error(cmp.Diff(out, tc.out))
			t.Errorf("GetTables('%+v')\n Got: %+v\n Want: %+v\n", tc.in, out, tc.out)
		}
	}
}
