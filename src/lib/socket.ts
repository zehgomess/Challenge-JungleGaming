import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    const url = import.meta.env.VITE_WS_URL || window.location.origin
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  const s = socket
  if (s) {
    s.removeAllListeners()
    s.disconnect()
    socket = null
  }
}
