import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ location }) => {
    requireAuth(location.href)
  },
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-text-h">Perfil do colecionador</h1>
      <p className="text-text mt-2">Em implementação (Fase 6).</p>
    </div>
  )
}
