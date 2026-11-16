import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Enable mocking only when VITE_MSW_MODE is set to 'mock'
export function enableMocking() {
  if (import.meta.env.VITE_MSW_MODE === 'mock') {
    worker.start()
  }
}