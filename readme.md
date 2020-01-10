# ts-mysql-plugin (Beta)

![Alt Text](https://github.com/segmentio/ts-mysql-plugin/workflows/CI/badge.svg)

A typescript language service plugin that gives superpowers to SQL tagged template literals. Specifically aimed at the MySQL syntax.

![Alt Text](https://github.com/segmentio/ts-mysql-plugin/raw/master/.github/demo.gif)

## Features

- Autocomplete for MySQL keywords
- Autocomplete for table names and column names (powered by your schema)
- Hover documentation for MySQL keywords
- Hover documentation for tables and columns (powered by your schema)
- Diagnostics for MySQL syntax errors
- Diagnostics for invalid table names and column names (powered by your schema)
- Diagnostics for invalid column types (powered by your schema)
- Works in all major editors (VSCode, Sublime Text, Atom, etc.)

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

## Developing

Prerequisite: Go is required in order to build the binary for the MySQL parser.

Run the following:

```shell
go get
yarn install && yarn build
cd example-project && yarn install && code .
cd .. && yarn watch
```

Your editor should now be open with the `example-project` directory at the root. Open `src/index.ts` and you should see diagnostics errors.

## Testing

Assuming you've run all the steps in the "Development" section, then run the following:

```shell
cd e2e && yarn install
cd .. && yarn test
```

## Publishing

We use [`np`](https://github.com/sindresorhus/np) to cut and publish new releases. Run the following:

```shell
yarn run pub
```

## License

[MIT](https://tldrlegal.com/license/mit-license)
