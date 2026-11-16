import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

const socketProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const socketHost = typeof window !== 'undefined' ? window.location.host : 'localhost:5173'

// Match the same-origin Socket.IO endpoint in dev, preview, and production.
// A fixed localhost URL only worked in Vite dev and caused production clients
// to attempt a real (nonexistent) WebSocket server.
export const socketLink = ws.link(`${socketProtocol}//${socketHost}/socket.io`)

const clients = new Set<any>()

export function emitToAll(event: string, payload: any) {
  for (const io of clients) {
    try {
      io.emit(event, payload)
    } catch {
      // ignore
    }
  }
}

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    clients.add(io)
    connection.client.addEventListener('close', () => {
      clients.delete(io)
    })
  }),
]
