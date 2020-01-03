package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sort"

	"github.com/urfave/cli/v2"
	"vitess.io/vitess/go/vt/sqlparser"
)

// Error represents an error.
type Error struct {
	Name string `json:"name"`
	Message string `json:"message"`
}

func main() {
	var query string

	app := &cli.App{
		Name:    "sqlparser",
		Version: "0.0.1",
		Usage:   "a simple cli to parse sql queries",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:        "query",
				Usage:       "query to parse (e.g. 'select * from test')",
				Destination: &query,
			},
		},
		Commands: []*cli.Command{
			{
				Name:    "parse",
				Aliases: []string{"v"},
				Usage:   "parse a sql query",
				Action: func(c *cli.Context) error {
					result := map[string]interface{}{}
					tree, err := sqlparser.ParseStrictDDL(query)

					if err != nil {
						result["error"] = Error{
							Name: "SyntaxError",
							Message: err.Error(),
						}
					} else {
						result["data"] = map[string]interface{}{
							"ast": tree,
							"tables":	GetTables(tree),
						}
					}

					resultJSON, _ := json.Marshal(&result)
					fmt.Println(string(resultJSON))
					return nil
				},
			},
		},
	}

	sort.Sort(cli.FlagsByName(app.Flags))
	sort.Sort(cli.CommandsByName(app.Commands))

	err := app.Run(os.Args)
	if err != nil {
		log.Fatal(err)
	}
}

// Tables represents an array of tables.
type Tables = []Table

// Table represents a SQL table.
type Table struct {
	Name string `json:"name"`
	Alias string `json:"alias,omitempty" bson:",omitempty"`
	Columns TableColumns `json:"columns"`
}

// TableColumns represents an array of table columns.
type TableColumns = []TableColumn

// TableColumn represents a SQL table column.
type TableColumn struct {
	Name string `json:"name"`
}

// Columns represents an array of columns.
type Columns = []Column

// Column represents a column.
type Column struct {
	Name string
	TableAlias string
}

// GetTables gets all tables in the query.
func GetTables(tree sqlparser.SQLNode) Tables {
	tables := make(Tables, 0)
	columns := make(Columns, 0)

	// special names stores names for cases when the other types
	// do not store the name, e.g. in an INSERT INTO statement.
	// It's an oddity of the sqlparser AST.
	specialNames := map[string]bool{}
	tableHasQualifier := map[string]bool{}
	namesAlreadyAddedToTables := map[string]bool{}

	_ = sqlparser.Walk(func(node sqlparser.SQLNode) (kontinue bool, err error) {
		switch node := node.(type) {
			case *sqlparser.AliasedTableExpr:
				name := sqlparser.GetTableName(node.Expr).CompliantName()
				alias := node.As.CompliantName()
				tables = append(tables, Table{
					Name: name,
					Alias: alias,
					Columns: make([]TableColumn, 0),
				})
				namesAlreadyAddedToTables[name] = true
			case *sqlparser.ColName:
				name := node.Name.CompliantName()
				qualifier := node.Qualifier.Name.CompliantName()
				if qualifier != "" {
					tableHasQualifier[qualifier] = true
				}
				columns = append(columns, Column{
					Name: name,
					TableAlias: qualifier,
				})
			case sqlparser.ColIdent:
				name := node.CompliantName()
				if (name != "") {
					columns = append(columns, Column{
						Name: name,
					})
				}
			case sqlparser.TableName:
				name := node.Name.CompliantName()
				specialNames[name] = true
		}
		return true, nil
	}, tree)

	for name := range specialNames {
		if !tableHasQualifier[name] && !namesAlreadyAddedToTables[name] {
			// ... this name is not a qualifier, and it's not already added, so add it
			tables = append(tables, Table{
				Name: name,
				Columns: make([]TableColumn, 0),
			})
		}
	}

	columnToTable := map[string]bool{}

	if len(tables) == 1 {
		for _, column := range columns {
			tables[0].Columns = append(tables[0].Columns,  TableColumn{
				Name: column.Name,
			})
		}
	} else if len(tables) > 1 {
		for _, column := range columns {
			for j, table := range tables {
				if table.Alias == column.TableAlias {
					alreadyAdded := columnToTable[column.Name]
					if !alreadyAdded {
						tables[j].Columns = append(tables[j].Columns,  TableColumn{
							Name: column.Name,
						})
						columnToTable[column.Name] = true
					}
				}
			}
		}
	}

	return tables
}
