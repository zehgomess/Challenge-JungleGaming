import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

export const socketLink = ws.link('ws://localhost:5173/socket.io')

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
