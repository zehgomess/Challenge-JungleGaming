import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { enableMocking } from './mocks/browser'

async function createAppRouter() {
  const { routeTree } = await import('./routeTree.gen')
  return createRouter({ routeTree })
}

type AppRouter = Awaited<ReturnType<typeof createAppRouter>>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}

async function bootstrap() {
  await enableMocking()
  const router = await createAppRouter()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

bootstrap()
