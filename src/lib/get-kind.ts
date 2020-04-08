import { ScriptElementKind } from 'typescript/lib/tsserverlibrary'

export function getKind(type: 'keyword' | 'table' | 'column'): ScriptElementKind {
  switch (type) {
    case 'keyword':
      return ScriptElementKind.keyword
    case 'table':
      return ScriptElementKind.classElement
    case 'column':
      return ScriptElementKind.memberVariableElement
  }
}
