package main

import (
	"reflect"
	"testing"

	"vitess.io/vitess/go/vt/sqlparser"
)

// TestGetTables ensures that it works.
func TestGetTables(t *testing.T) {
	testcases := []struct {
		in  string
		out Tables
	}{{
		in:  "SELECT w.id, s.slug FROM workspaces w INNER JOIN sources s ON s.workspace_id = w.id",
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
		in:  "INSERT INTO allowed_labels (workspace_id, labels) VALUES ('some-id', 'some-label')",
		out: []Table{
			Table{
				Name:  "allowed_labels",
				Columns: []TableColumn{
					TableColumn{Name: "workspace_id"},
					TableColumn{Name: "labels"},
				},
			},
		},
	}, {
		in:  "CREATE TABLE foo (id int, slug varbinary(10))",
		out: []Table{
			Table{
				Name:  "foo",
				Columns: []TableColumn{},
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
		if reflect.DeepEqual(out, tc.out) == false {
			t.Errorf("GetTables('%s'): %s, want %s", tc.in, out, tc.out)
		}
	}
}
