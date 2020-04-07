import { DiagnosticSeverity } from 'ts-mysql-analyzer'
import { DiagnosticCategory } from 'typescript/lib/tsserverlibrary'

export function mapSeverity(severity: DiagnosticSeverity): DiagnosticCategory {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return DiagnosticCategory.Error
    case DiagnosticSeverity.Suggestion:
      return DiagnosticCategory.Suggestion
    case DiagnosticSeverity.Warning:
      return DiagnosticCategory.Warning
  }
}
