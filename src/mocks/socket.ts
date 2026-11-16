import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

const socketProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const socketHost = typeof window !== 'undefined' ? window.location.host : 'localhost:5173'

// Match the same-origin Socket.IO endpoint in dev, preview, and production.
// MSW normalizes Socket.IO's default `/socket.io/` path to `/` before matching.
export const socketLink = ws.link(`${socketProtocol}//${socketHost}`)

type MockSocket = ReturnType<typeof toSocketIo> & { userId?: string }
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

export function disconnectSocketClients() {
  const count = clients.size
  for (const socket of clients) {
    try {
      socket.rawClient.close(4000, 'Simulated Socket.IO disconnect')
    } catch {
      // The connection may already be closing.
    }
  }
  return count
}

export function emitToAll(event: string, payload: any) {
  emitToMatchingClients(event, payload)
}

export function emitToUser(userId: string, event: string, payload: any) {
  emitToMatchingClients(event, payload, userId)
}

function emitToMatchingClients(event: string, payload: any, userId?: string) {
  let sent = 0
  let errors = 0
  let lastError: string | undefined
  const recipients = Array.from(clients).filter((socket) => !userId || socket.userId === userId)
  for (const socket of recipients) {
    try {
      socket.client.emit(event, payload)
      sent += 1
    } catch (error) {
      errors += 1
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  lastBroadcast = { event, clients: recipients.length, sent, errors, lastError }
}

export function getSocketBroadcastDiagnostics() {
  return lastBroadcast ? { ...lastBroadcast } : null
}

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const socket = toSocketIo(connection) as MockSocket
    clients.add(socket)
    socket.client.on('session:identify', (_event, payload) => {
      const userId = typeof payload === 'string' ? payload : payload?.userId
      if (typeof userId === 'string') socket.userId = userId
      else if (userId === null) delete socket.userId
    })
    connection.client.addEventListener('close', () => {
      clients.delete(socket)
    })
  }),
]
