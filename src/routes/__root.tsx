import { Outlet, createRootRoute } from '@tanstack/react-router'
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
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-background text-text">
            <NavBar />
            <main className="flex-grow">
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
