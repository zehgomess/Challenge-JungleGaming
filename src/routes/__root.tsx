import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/store/query'
import { NavBar } from '@/components/navbar'
import { Sonner } from '@/components/ui/sonner'
import { SocketManager } from '@/components/socket-manager'
import { SessionProvider } from '@/store/session'
import { CartProvider } from '@/store/cart'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-background text-text">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-text-h">
              Pular para o conteudo principal
            </a>
            <NavBar />
            <main id="main-content" ref={mainRef} className="flex-grow" tabIndex={-1}>
              <Outlet />
            </main>
            <Sonner position="top-right" />
            <SocketManager />
          </div>
        </CartProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
