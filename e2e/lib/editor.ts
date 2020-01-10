import Server from './server'
import { QuickInfo, CompletionEntry, Diagnostic } from 'typescript/lib/tsserverlibrary'

interface Location {
  offset: number
  line: number
}

export interface RequestData {
  location?: Location
  command: string
  body: string
}

export default async function request<T>(request: RequestData): Promise<T> {
  const server = new Server()
  const response = await server.execute(request)

  expect(response).not.toBeUndefined()
  expect(response.success).toBeTruthy()

  return <T>response.body
}

export function hover(body: string, location: Location): Promise<QuickInfo> {
  return request<QuickInfo>({
    command: 'quickinfo',
    location,
    body
  })
}

export function complete(body: string, location: Location): Promise<CompletionEntry[]> {
  return request<CompletionEntry[]>({
    command: 'completions',
    location,
    body
  })
}

export function diagnostics(body: string): Promise<Diagnostic[]> {
  return request<Diagnostic[]>({
    command: 'semanticDiagnosticsSync',
    body
  })
}
