import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { socketHandlers } from './socket'

export const worker = setupWorker(...handlers, ...socketHandlers)

// Enable mocking in dev/demo builds by default; can be disabled with VITE_MSW_MODE=off
export async function enableMocking() {
  const mode = import.meta.env.VITE_MSW_MODE
  if (mode === 'off') return
  if (import.meta.env.DEV || import.meta.env.PROD || mode === 'mock' || mode === 'on') {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    })
  }
}