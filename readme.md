# ts-mysql-plugin (Alpha)

A typescript language service plugin that gives superpowers to SQL tagged template literals. Specifically aimed at the MySQL syntax.

![Alt Text](https://github.com/segmentio/ts-mysql-plugin/raw/master/.github/demo.gif)

## Features

- Autocomplete for MySQL keywords
- Autocomplete for table names and column names (if a local database URI is provided)
- Hover documentation for MySQL keywords
- Hover documentation for tables and columns (if a local database URI is provided)
- Diagnostics for MySQL syntax errors
- Diagnostics for invalid table names and column names (if a local database URI is provided)
- Diagnostics for invalid column types (if a local database URI is provided)

## Installing

Step 1: Yarn.

```sh
yarn add --dev ts-mysql-plugin
```

Step 2: TS Config.

Add the plugin to your compiler options in `tsconfig.json`. Note that `databaseUri` is optional, but recommended.

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "ts-mysql-plugin",
        "databaseUri": "mysql://USER@HOST/DB_NAME"
      }
    ]
  }
}
```

You can also optionally override the default tags ("SQL" and "sql") by adding a "tags" array to the config. For example, if you want the plugin to activate only on "Sql" tags:

```json
{
  "name": "ts-mysql-plugin",
  "tags": ["Sql"]
}
```

## Development

Prerequisite: Go is required in order to build the binary for the MySQL parser.

Run the following:

```shell
go get
yarn install && yarn build
cd example-project && yarn install
cd .. && yarn watch
```

Navigate to `example-project/tsconfig.json` and change the plugin path name for your setup. Navigate to `example-project/src/index.ts` and you should see errors in the `invalid queries` section.

## Tests

Assuming you've run all the steps in the "Development" section, then run the following:

```shell
cd e2e && yarn install
cd .. && yarn run e2e
```

## Note

TLDR; If anyone knows of a MySQL parser that can track node position, please let me know.

I can't find a MySQL parser with the ability to track node position. All the features in this plugin work around that problem. For example, when a user is hovering over a word, instead of finding the AST node corresponding to that word, we check all possibilities (e.g. is this a table name? is this a column name? is this a keyword?). Having the node itself would make this plugin far more accurate.
