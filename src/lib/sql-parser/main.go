package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/urfave/cli/v2"
	"vitess.io/vitess/go/vt/sqlparser"
)

// Result represents the parse result.
type Result struct {
	Statements Statements       `json:"statements"`
	Error      *SyntaxErrorData `json:"error,omitempty"`
}

// Statements represents all statements in the query.
type Statements = []Statement

// Statement represents a single statement in the query.
type Statement struct {
	Type   string              `json:"type"`
	Tables Tables              `json:"tables"`
	Tree   sqlparser.Statement `json:"tree"`
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
					result := Parse(query)
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

// Parse parses the query.
func Parse(originalQuery string) Result {
	result := Result{}

	const cutset = "\t \n \v \f \r"
	beforeLength := len(originalQuery)
	formattedQuery := strings.TrimLeft(originalQuery, cutset)
	afterLength := len(formattedQuery)
	amountToAddToError := beforeLength - afterLength
	formattedQuery = strings.TrimRight(formattedQuery, cutset)

	queries, err := sqlparser.SplitStatementToPieces(formattedQuery)
	if err != nil {
		result.Error = ParseSyntaxError(err, amountToAddToError)
	} else {
		statements := Statements{}

		for _, query := range queries {
			tree, err := sqlparser.ParseStrictDDL(query)
			if err != nil {
				result.Error = ParseSyntaxError(err, amountToAddToError)
				break // if one query fails, the rest cannot be parsed
			} else {
				statements = append(statements, Statement{
					Tables: GetTables(tree),
					Tree:   tree,
					Type:   sqlparser.Preview(query).String(),
				})
			}
			// In multiple statements, if there's a syntax error, the parser includes a position
			// relative to the single statement being parsed, so we need to manually keep track
			// of how much to add to the position.
			amountToAddToError += len(query) + 1
		}

		result.Statements = statements
	}

	return result
}

// SyntaxErrorData represents the data parsed from the syntax error.
type SyntaxErrorData struct {
	Position int    `json:"position"`
	Near     string `json:"near"`
}

// ParseSyntaxError parses the syntax error.
// e.g. syntax error at position 10 near 'selec'
func ParseSyntaxError(err error, amountToAddToError int) *SyntaxErrorData {
	pattern := regexp.MustCompile(`syntax error at position (\d+)(?: near ['"](\w+)['"])?`)
	matches := pattern.FindAllStringSubmatch(err.Error(), -1)

	var position string
	var near string
	for _, match := range matches {
		position = match[1]
		near = match[2]
	}

	endPosition, err := strconv.Atoi(position)
	if err != nil {
		// noop
	}

	return &SyntaxErrorData{
		Position: endPosition + amountToAddToError,
		Near:     near,
	}
}

// Tables represents an array of tables.
type Tables = []Table

// Table represents a SQL table.
type Table struct {
	Name    string       `json:"name"`
	Alias   string       `json:"alias,omitempty" bson:",omitempty"`
	Columns TableColumns `json:"columns"`
	Rows    TableRows    `json:"rows"`
}

// TableColumns represents an array of table columns.
type TableColumns = []TableColumn

// TableColumn represents a SQL table column.
type TableColumn struct {
	Name     string      `json:"name"`
	Value    interface{} `json:"value"`
	TsType   string      `json:"tsType"`
	Operator string      `json:"operator"`
	InType   string      `json:"inType"` // list or expression
}

// Columns represents an array of columns.
type Columns = []Column

// Column represents a column.
type Column struct {
	Name       string
	TableAlias string
}

// Comparisons represents an array of comparisons.
type Comparisons = []Comparison

// Comparison represents a comparison expression.
type Comparison struct {
	Table    string
	Column   string
	Operator string
	Value    interface{}
	TsType   string
	InType   string
}

// TableRows represents an array of table rows.
type TableRows = []TableRow

// TableRow represents an insert table row.
type TableRow struct {
	TsType string
	Value  interface{}
}

// Rows represents an array of rows.
type Rows = []Row

// Row represents an insert row.
type Row struct {
	Table  string
	TsType string
	Value  interface{}
}

// GetTables gets all tables in the query.
func GetTables(tree sqlparser.SQLNode) Tables {
	columnNames := make(map[string]bool, 0)
	tableNames := make(map[string]bool, 0)
	comparisons := make(Comparisons, 0)
	columns := make(Columns, 0)
	tables := make(Tables, 0)
	rows := make(Rows, 0)

	// Walking the AST is expensive, so we'll do it once, grab all relevant information, and organize it later.
	_ = sqlparser.Walk(func(node sqlparser.SQLNode) (kontinue bool, err error) {
		switch node := node.(type) {
		case *sqlparser.AliasedTableExpr:
			tableName := sqlparser.GetTableName(node.Expr).CompliantName()
			if tableName != "" {
				tables = append(tables, Table{
					Name:    tableName,
					Alias:   node.As.CompliantName(),
					Columns: make([]TableColumn, 0),
				})
			}
		case *sqlparser.ColName:
			columnName := node.Name.CompliantName()
			if columnName != "" {
				columns = append(columns, Column{
					Name:       columnName,
					TableAlias: node.Qualifier.Name.CompliantName(),
				})
			}
		case sqlparser.TableName:
			tableName := node.Name.CompliantName()
			if tableName != "" {
				tableNames[tableName] = true
			}
		case *sqlparser.ComparisonExpr:
			if sqlparser.IsColName(node.Left) {
				left := node.Left.(*sqlparser.ColName)
				value := GetValueAndType(node.Right)

				if IsValue(node.Right) {
					comparisons = append(comparisons, Comparison{
						Table:    left.Qualifier.Name.CompliantName(),
						Column:   left.Name.CompliantName(),
						Operator: node.Operator,
						Value:    value.Value,
						TsType:   value.TsType,
						InType:   "expression",
					})
				}
			}
		case *sqlparser.Insert:
			table := node.Table.Name.CompliantName()
			insertRows := node.Rows.(sqlparser.Values)[0]

			for _, insertRow := range insertRows {
				value := GetValueAndType(insertRow)
				rows = append(rows, Row{
					Table:  table,
					TsType: value.TsType,
					Value:  value.Value,
				})
			}

			// The SQL parser doesn't currently throw an error if
			// you try to insert more rows than specified columns.
			// We'll handle this problem in the client.
			if len(rows) != len(node.Columns) {
				for _, column := range node.Columns {
					name := column.CompliantName()
					// This allows us to skip looking for `ColIdent`, which solves the problem that Vitess has
					// of misidentifying function calls as `ColIdent`
					columnNames[name] = true
					comparisons = append(comparisons, Comparison{
						Table:  table,
						Column: column.CompliantName(),
						InType: "list",
					})
				}
			} else {
				for i, column := range node.Columns {
					value := GetValueAndType(insertRows[i])
					name := column.CompliantName()
					// This allows us to skip looking for `ColIdent`, which solves the problem that Vitess has
					// of misidentifying function calls as `ColIdent`
					columnNames[name] = true
					comparisons = append(comparisons, Comparison{
						Table:  table,
						Column: column.CompliantName(),
						Value:  value.Value,
						TsType: value.TsType,
						InType: "list",
					})
				}
			}
		}
		return true, nil
	}, tree)

	// create table for unaliased table names, and add to tables list
	for tableName := range tableNames {
		if nameInTables(tableName, tables) {
			continue
		}
		if tableAlias(tableName, tables) {
			continue
		}
		tables = append(tables, Table{
			Name:    tableName,
			Columns: make([]TableColumn, 0),
		})
	}

	// create column for unaliased column names, and add to columns list
	for columnName := range columnNames {
		if nameInColumns(columnName, columns) {
			continue
		}
		columns = append(columns, Column{
			Name: columnName,
		})
	}

	// merge columns into corresponding table
	for _, column := range columns {
		for j, table := range tables {
			if table.Alias != column.TableAlias {
				continue
			}
			if columnInTable(column.Name, table) {
				continue
			}
			table.Columns = append(table.Columns, TableColumn{
				Name: column.Name,
			})
			tables[j] = table
		}
	}

	// merge rows into corresponding table
	for _, row := range rows {
		for j, table := range tables {
			if row.Table != table.Name {
				continue
			}
			table.Rows = append(table.Rows, TableRow{
				TsType: row.TsType,
				Value:  row.Value,
			})
			tables[j] = table
		}
	}

	for _, comparison := range comparisons {
		tableName := comparison.Table

		if tableName == "" {
			if len(tables) != 1 {
				continue
			}
			tableName = tables[0].Name
		}

		for _, table := range tables {
			if table.Name != tableName {
				continue
			}

			for j, column := range table.Columns {
				if column.Name != comparison.Column {
					continue
				}

				column.Operator = comparison.Operator
				column.TsType = comparison.TsType
				column.Value = comparison.Value
				column.InType = comparison.InType

				table.Columns[j] = column
			}
		}
	}

	// sort tables by name
	sort.Sort(byTableName(tables))

	// sort columns by name
	for _, table := range tables {
		sort.Sort(byColumnName(table.Columns))
	}

	return tables
}

// byTableName implements sort.Interface based on the Name field.
type byTableName Tables

func (a byTableName) Len() int {
	return len(a)
}
func (a byTableName) Less(i, j int) bool {
	return a[i].Name < a[j].Name
}
func (a byTableName) Swap(i, j int) {
	a[i], a[j] = a[j], a[i]
}

// byColumnName implements sort.Interface based on the Name field.
type byColumnName TableColumns

func (a byColumnName) Len() int {
	return len(a)
}
func (a byColumnName) Less(i, j int) bool {
	return a[i].Name < a[j].Name
}
func (a byColumnName) Swap(i, j int) {
	a[i], a[j] = a[j], a[i]
}

// IsValue returns true if the Expr is a string, integral or value arg.
// NULL is not considered to be a value.
func IsValue(node sqlparser.Expr) bool {
	switch v := node.(type) {
	case *sqlparser.SQLVal:
		switch v.Type {
		case sqlparser.StrVal, sqlparser.HexVal, sqlparser.IntVal, sqlparser.ValArg:
			return true
		}
	case sqlparser.BoolVal:
		{
			return true
		}
	case *sqlparser.NullVal:
		{
			return true
		}
	}
	return false
}

// SQLValue represents a SQL value.
type SQLValue struct {
	Value  interface{}
	TsType string
}

// GetValueAndType returns the SQLValue for an expression.
func GetValueAndType(node sqlparser.Expr) SQLValue {
	switch v := node.(type) {
	case *sqlparser.SQLVal:
		switch v.Type {
		case sqlparser.StrVal:
			value := string(v.Val)

			_, err := time.Parse(time.RFC3339, value)
			if err == nil {
				return SQLValue{
					Value:  value,
					TsType: "date",
				}
			}

			return SQLValue{
				Value:  string(v.Val),
				TsType: "string",
			}
		case sqlparser.IntVal, sqlparser.FloatVal, sqlparser.HexNum, sqlparser.HexVal:
			value, _ := strconv.ParseInt(string(v.Val), 0, 64)
			return SQLValue{
				Value:  int(value),
				TsType: "number",
			}
		}
	case sqlparser.BoolVal:
		value := false
		if v {
			value = true
		}
		return SQLValue{
			Value:  value,
			TsType: "boolean",
		}
	case *sqlparser.NullVal:
		return SQLValue{
			Value:  nil,
			TsType: "null",
		}
	}
	return SQLValue{}
}

func nameInTables(name string, tables []Table) bool {
	for _, table := range tables {
		if name == table.Name {
			return true
		}
	}
	return false
}

func nameInColumns(name string, columns []Column) bool {
	for _, column := range columns {
		if name == column.Name {
			return true
		}
	}
	return false
}

func columnInTable(name string, table Table) bool {
	for _, column := range table.Columns {
		if name == column.Name {
			return true
		}
	}
	return false
}

func tableAlias(name string, tables []Table) bool {
	for _, table := range tables {
		if name == table.Alias {
			return true
		}
	}
	return false
}
