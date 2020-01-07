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
					TableColumn{Name: "id"},
				},
			},
			Table{
				Name:  "sources",
				Alias: "s",
				Columns: []TableColumn{
					TableColumn{Name: "slug"},
					TableColumn{Name: "workspace_id"},
				},
			},
		},
	}, {
		in: "INSERT INTO allowed_labels (workspace_id, labels) VALUES ('some-id', 'some-label')",
		out: []Table{
			Table{
				Name:  "allowed_labels",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{Name: "workspace_id"},
					TableColumn{Name: "labels"},
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
		in: "SELECT id FROM workspaces WHERE version = 'xxxxx'",
		out: []Table{
			Table{
				Name:  "workspaces",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{Name: "id"},
					TableColumn{Name: "version"},
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
					TableColumn{Name: "id"},
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
