import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

const socketProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const socketHost = typeof window !== 'undefined' ? window.location.host : 'localhost:5173'

// Match the same-origin Socket.IO endpoint in dev, preview, and production.
// MSW normalizes Socket.IO's default `/socket.io/` path to `/` before matching.
export const socketLink = ws.link(`${socketProtocol}//${socketHost}`)

type MockSocket = ReturnType<typeof toSocketIo>
const clients = new Set<MockSocket>()

export function emitToAll(event: string, payload: any) {
  for (const socket of clients) {
    try {
      socket.server.emit(event, payload)
    } catch {
      // ignore
    }
  }
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
