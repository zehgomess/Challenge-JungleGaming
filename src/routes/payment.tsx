import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth'

export const Route = createFileRoute('/payment')({
  beforeLoad: ({ location }) => {
    requireAuth(location.href)
  },
  component: PaymentPage,
})

function PaymentPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-text-h">Pagamento</h1>
      <p className="text-text mt-2">Checkout em implementação (Fase 5).</p>
    </div>
  )
}
