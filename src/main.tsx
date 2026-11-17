import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { BootstrapScreen } from '@/components/bootstrap-screen'

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
  const root = createRoot(document.getElementById('root')!)
  root.render(
    <StrictMode>
      <BootstrapScreen />
    </StrictMode>,
  )

  // Show the first-paint shell while MSW and routes initialize. Keep startup
  // serial here: the Socket.IO mock must be active before the route tree mounts.
  const mocks = await import('./mocks/browser')
  await mocks.enableMocking()
  const router = await createAppRouter()
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

bootstrap()
