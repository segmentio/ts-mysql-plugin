package main

import (
	"errors"
	"testing"

	"github.com/google/go-cmp/cmp"
	"vitess.io/vitess/go/vt/sqlparser"
)

// TestParse ensures that it send the right errors.
func TestParseErrors(t *testing.T) {
	testcases := []struct {
		in  string
		out *SyntaxErrorData
	}{{
		in: "SELEC * FROM users",
		out: &SyntaxErrorData{
			Near:     "SELEC",
			Position: 6,
		},
	}, {
		in: "  SELEC * FROM users",
		out: &SyntaxErrorData{
			Near:     "SELEC",
			Position: 8,
		},
	}, {
		in: "  SELECT * FROM users; SELEC * FROM workspaces;",
		out: &SyntaxErrorData{
			Near:     "SELEC",
			Position: 29,
		},
	}, {
		in: "            SELECT * FROM users;     SELEC * FROM workspaces;",
		out: &SyntaxErrorData{
			Near:     "SELEC",
			Position: 43,
		},
	}}

	for _, tc := range testcases {
		out := Parse(tc.in)
		if cmp.Equal(out.Error, tc.out) == false {
			t.Error(cmp.Diff(out.Error, tc.out))
			t.Errorf("Parse('%+v')\n Got: %+v\n Want: %+v\n", tc.in, out.Error, tc.out)
		}
	}
}

// TestParseSyntaxError ensures that it works.
func TestParseSyntaxError(t *testing.T) {
	testcases := []struct {
		in  string
		out *SyntaxErrorData
	}{{
		in: "syntax error at position 10 near 'selec'",
		out: &SyntaxErrorData{
			Near:     "selec",
			Position: 10,
		},
	}, {
		in: "syntax error at position 5 near 'foo'",
		out: &SyntaxErrorData{
			Near:     "foo",
			Position: 5,
		},
	}, {
		in: "syntax error at position 5",
		out: &SyntaxErrorData{
			Near:     "",
			Position: 5,
		},
	}}

	for _, tc := range testcases {
		out := ParseSyntaxError(errors.New(tc.in), 0)
		if cmp.Equal(out, tc.out) == false {
			t.Error(cmp.Diff(out, tc.out))
			t.Errorf("ParseSyntaxError('%+v')\n Got: %+v\n Want: %+v\n", tc.in, out, tc.out)
		}
	}
}

// TestGetTables ensures that it works.
func TestGetTables(t *testing.T) {
	testcases := []struct {
		in  string
		out Tables
	}{{
		in: "SELECT w.id, s.slug FROM workspaces w INNER JOIN sources s ON s.workspace_id = w.id",
		out: []Table{
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
			Table{
				Name:  "workspaces",
				Alias: "w",
				Columns: []TableColumn{
					TableColumn{
						Name: "id",
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
						Name:   "id",
						InType: "list",
						Value:  "some-id",
						TsType: "string",
					},
					TableColumn{
						Name:   "labels",
						InType: "list",
						Value:  false,
						TsType: "boolean",
					},
					TableColumn{
						Name:   "workspace_id",
						InType: "list",
						Value:  123,
						TsType: "number",
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
						Name:     "isForced",
						InType:   "expression",
						TsType:   "boolean",
						Value:    false,
						Operator: "=",
					},
					TableColumn{
						Name:     "slug",
						InType:   "expression",
						TsType:   "string",
						Value:    "xxxxx",
						Operator: "=",
					},
					TableColumn{
						Name:     "version",
						InType:   "expression",
						TsType:   "number",
						Value:    332,
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
						Name:     "version",
						InType:   "expression",
						TsType:   "null",
						Value:    nil,
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
						Name:     "created_at",
						InType:   "expression",
						TsType:   "date",
						Value:    "2020-01-09T00:57:29.965Z",
						Operator: "=",
					},
					TableColumn{
						Name: "id",
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
						Name:     "features",
						InType:   "expression",
						TsType:   "string",
						Value:    "{}",
						Operator: "=",
					},
					TableColumn{
						Name: "id",
					},
				},
			},
		},
	}, {
		in: "SELECT id FROM workspaces WHERE JSON_TYPE(JSON_EXTRACT(features, '$')) != 'NULL'",
		out: []Table{
			Table{
				Name:  "workspaces",
				Alias: "",
				Columns: []TableColumn{
					TableColumn{
						Name: "features",
					},
					TableColumn{
						Name: "id",
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
