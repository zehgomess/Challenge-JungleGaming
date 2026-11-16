import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { socketHandlers } from './socket'

export const worker = setupWorker(...handlers, ...socketHandlers)

// Enable mocking in dev by default, or when explicitly set
export async function enableMocking() {
  const mode = import.meta.env.VITE_MSW_MODE
  if (mode === 'off') return
  if (import.meta.env.DEV || mode === 'mock' || mode === 'on') {
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}