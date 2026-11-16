import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { enableMocking } from './mocks/browser'
import { SessionProvider } from './store/session'
import { CartProvider } from './store/cart'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function bootstrap() {
  await enableMocking()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SessionProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </SessionProvider>
    </StrictMode>,
  )
}

bootstrap()
