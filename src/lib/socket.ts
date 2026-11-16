import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let lastConnectError: string | null = null

export function getSocket() {
  if (!socket) {
    const url = import.meta.env.VITE_WS_URL || window.location.origin
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })
    socket.on('connect', () => {
      lastConnectError = null
    })
    socket.on('connect_error', (error) => {
      lastConnectError = error.message
    })
  }
  return socket
}

export function getSocketDiagnostics() {
  const current = socket
  return {
    connected: current?.connected ?? false,
    transport: current?.io.engine?.transport?.name ?? null,
    lastConnectError,
  }
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
