import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

const socketProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const socketHost = typeof window !== 'undefined' ? window.location.host : 'localhost:5173'

// Match the same-origin Socket.IO endpoint in dev, preview, and production.
// MSW normalizes Socket.IO's default `/socket.io/` path to `/` before matching.
export const socketLink = ws.link(`${socketProtocol}//${socketHost}`)

type MockSocket = ReturnType<typeof toSocketIo>
const clients = new Set<MockSocket>()
let lastBroadcast: {
  event: string
  clients: number
  sent: number
  errors: number
  lastError?: string
} | null = null

export function getSocketClientCount() {
  return clients.size
}

export function emitToAll(event: string, payload: any) {
  let sent = 0
  let errors = 0
  let lastError: string | undefined
  for (const socket of clients) {
    try {
      socket.client.emit(event, payload)
      sent += 1
    } catch (error) {
      errors += 1
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  lastBroadcast = { event, clients: clients.size, sent, errors, lastError }
}

export function getSocketBroadcastDiagnostics() {
  return lastBroadcast ? { ...lastBroadcast } : null
}

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const socket = toSocketIo(connection)
    clients.add(socket)
    connection.client.addEventListener('close', () => {
      clients.delete(socket)
    })
  }),
]
