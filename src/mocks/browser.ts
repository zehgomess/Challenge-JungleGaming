import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Enable mocking in dev by default, or when explicitly set
export async function enableMocking() {
  const mode = import.meta.env.VITE_MSW_MODE
  if (mode === 'off') return
  if (import.meta.env.DEV || mode === 'mock' || mode === 'on') {
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}