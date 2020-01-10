import { RequestData } from './editor'
import readline from 'readline'
import execa from 'execa'
import path from 'path'

const root = path.join(__dirname, '..')
const serverPath = path.join(root, 'node_modules', 'typescript', 'lib', 'tsserver')
const projectPath = path.join(root, 'project-fixture')
const fileName = path.join(projectPath, 'main.ts')

interface CommandRequest {
  name: string
  arguments: any
}

interface CommandRequestArguments {
  file: string
  line?: number
  offset?: number
  fileContent?: string
  scriptKindName?: string
}

export default class Server {
  server: execa.ExecaChildProcess
  responses: any[] = []
  sequences = 0

  public constructor() {
    this.server = execa.node(serverPath, [], { cwd: projectPath })

    const reader = readline.createInterface({
      input: this.server.stdout!
    })

    reader.on('line', (data: string): void => {
      const result = parse(data)
      if (result) {
        this.responses.push(result)
      }
    })
  }

  public async execute({ body, command, location }: RequestData): Promise<any> {
    this.send({
      name: 'open',
      arguments: {
        file: fileName,
        fileContent: body,
        scriptKindName: 'TS'
      }
    })

    const args: CommandRequestArguments = { file: fileName }
    if (location) {
      args.offset = location.offset
      args.line = location.line
    }

    this.send({
      name: command,
      arguments: args
    })

    this.server.stdin?.end()

    return new Promise((resolve, reject) => {
      this.server.on('error', (reason: string) => {
        reject(reason)
      })

      this.server.on('exit', () => {
        const data = this.responses.find(response => response.command === command)
        resolve(data)
      })
    })
  }

  public send(command: CommandRequest) {
    const data = JSON.stringify({
      arguments: command.arguments,
      command: command.name,
      seq: this.sequences,
      type: 'request'
    })

    this.server.stdin?.write(data + '\n')
    this.sequences += 1
  }
}

function parse(data: string): any {
  if (data.includes('Content-Length')) {
    return
  }

  let result = null

  try {
    result = JSON.parse(data)
  } catch (e) {
    // noop
  }

  if (result && result.type === 'response') {
    return result
  }
}
