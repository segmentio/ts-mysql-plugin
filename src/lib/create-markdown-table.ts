import markdownTable from 'markdown-table'
import { SchemaColumn } from 'ts-mysql-schema'

export function createMarkdownTable(columns: SchemaColumn[]): string {
  const pad = '&nbsp;'.repeat(5)
  const tableHeader = ['Name', pad, 'SQL Type', pad, 'TS Type', pad, 'Optional']
  const rows = columns.map(column => [
    column.name,
    pad,
    column.sqlType,
    pad,
    column.tsType,
    pad,
    String(column.optional)
  ])

  const table = markdownTable([tableHeader, ...rows])
  return table
}
