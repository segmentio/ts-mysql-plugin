import readline from 'readline'
import ts from 'typescript/lib/tsserverlibrary'
import execa from 'execa'
import delay from 'delay'
import path from 'path'

const root = path.join(__dirname, '..')
const serverPath = path.join(root, 'node_modules', 'typescript', 'lib', 'tsserver')
const fileName = path.join(root, 'project-fixture', 'main.ts')

interface CommandRequestArgs {
  file: string
  line?: number
  offset?: number
  fileContent?: string
}

interface Location {
  offset: number
  line: number
}

const TSServerClientOptionsDefaults = {
  enableLogging: false
}

interface TSServerClientOptions {
  enableLogging: boolean
}

class TSServerClient {
  private sequence = 0
  private child: execa.ExecaChildProcess
  private responses: any[] = []
  private events: any[] = []

  constructor(options: TSServerClientOptions = TSServerClientOptionsDefaults) {
    const serverOptions = []

    if (options.enableLogging) {
      const logfile = path.join(__dirname, 'log.txt')
      serverOptions.push('--logVerbosity', 'verbose', '--logFile', logfile)
    }

    this.child = execa.node(serverPath, serverOptions)
    if (!this.child) {
      throw new Error('Unable to start TS Server.')
    }

    const reader = readline.createInterface({
      input: this.child.stdout!
    })

    reader.on('line', (data: string) => {
      if (!data) {
        return
      }

      if (data.includes('Content-Length: ')) {
        return
      }

      try {
        const message = JSON.parse(data)
        if (message.type === 'event') {
          this.events.push(message)
        }
        if (message.type === 'response') {
          this.responses.push(message)
        }
      } catch (e) {
        // noop
      }
    })
  }

  writeMessage(message: string) {
    this.child.stdin!.write(message + '\n')
  }

  private processRequest(command: string, args: any): ts.server.protocol.Request {
    const request: ts.server.protocol.Request = {
      seq: this.sequence,
      type: 'request',
      arguments: args,
      command
    }
    this.sequence++
    const message = JSON.stringify(request)
    this.writeMessage(message)
    return request
  }

  private async processResponse(request: ts.server.protocol.Request): Promise<any> {
    const lastResponse = this.responses.shift()

    if (lastResponse && lastResponse.request_seq === request.seq) {
      return lastResponse
    } else {
      // Do not overload the CPU
      await delay(100)
      return this.processResponse(request)
    }
  }

  private async waitSchemaLoaded(): Promise<void> {
    const lastEvent = this.events.shift()

    if (lastEvent && lastEvent.event === 'schemaLoadingFinish') {
      return
    } else {
      // Do not overload the CPU
      await delay(100)
      this.waitSchemaLoaded()
    }
  }

  async openFile(file: string, fileContent?: string, scriptKindName?: 'TS' | 'JS' | 'TSX' | 'JSX'): Promise<void> {
    const args: ts.server.protocol.OpenRequestArgs = {
      file,
      fileContent,
      scriptKindName
    }
    this.processRequest(ts.server.CommandNames.Open, args)
    // TSServer does not respond when a file is opened.
    await delay(100)
  }

  async closeFile(file: string): Promise<void> {
    const args: ts.server.protocol.FileRequestArgs = { file }
    this.processRequest(ts.server.CommandNames.Close, args)
    // TSServer does not respond when a file is closed.
    await delay(100)
  }

  async connect(): Promise<void> {
    await this.openFile(fileName)
    await this.waitSchemaLoaded()
    await this.closeFile(fileName)
  }

  async disconnect(): Promise<void> {
    this.child.cancel()
    // Give it time to cancel.
    await delay(100)
  }

  async executeCommand(command: string, fileContent: string, location?: Location) {
    await this.openFile(fileName, fileContent)

    const requestArgs: CommandRequestArgs = {
      file: fileName,
      fileContent
    }

    if (location) {
      requestArgs.offset = location.offset
      requestArgs.line = location.line
    }

    const request = this.processRequest(command, requestArgs)
    const response = await this.processResponse(request)

    await this.closeFile(fileName)

    return response.body
  }

  getQuickInfoAtPosition(fileContent: string, location: Location): any {
    return this.executeCommand(ts.server.CommandNames.Quickinfo, fileContent, location)
  }

  getCompletionsAtPosition(fileContent: string, location: Location): any {
    return this.executeCommand(ts.server.CommandNames.Completions, fileContent, location)
  }

  getSemanticDiagnostics(fileContent: string): any {
    return this.executeCommand(ts.server.CommandNames.SemanticDiagnosticsSync, fileContent)
  }
}

export default new TSServerClient({ enableLogging: false })
