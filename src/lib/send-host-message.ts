import { server } from 'typescript/lib/tsserverlibrary'

interface HostMessage {
  event: string
  type: string
}

export function sendHostMessage(host: server.ServerHost, message: HostMessage): void {
  const json = JSON.stringify(message)
  const len = Buffer.byteLength(json, 'utf8')
  const msg = `Content-Length: ${1 + len}\r\n\r\n${json}${host.newLine}`
  host.write(msg)
}
