import { Outlet, createRootRoute } from '@tanstack/react-router'
import { NavBar } from '@/components/navbar'

export const rootRoute = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-text">
      <NavBar />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  )
}