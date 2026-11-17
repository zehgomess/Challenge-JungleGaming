import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BootstrapScreen } from '@/components/bootstrap-screen'

async function createAppRouter() {
  const [{ createRouter, RouterProvider }, { routeTree }] = await Promise.all([
    import('@tanstack/react-router'),
    import('./routeTree.gen'),
  ])
  return { router: createRouter({ routeTree }), RouterProvider }
}

type AppRouter = Awaited<ReturnType<typeof createAppRouter>>['router']

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

  // Do not load the route tree until MSW is active: parallel route startup can
  // race the custom Socket.IO WebSocket handler before it controls the page.
  const mocks = await import('./mocks/browser')
  await mocks.enableMocking()
  const { router, RouterProvider } = await createAppRouter()
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

bootstrap()
