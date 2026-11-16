import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth'

export const Route = createFileRoute('/order/confirmation')({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
  }),
  beforeLoad: ({ location }) => {
    requireAuth(location.href)
  },
  component: OrderConfirmationPage,
})

function OrderConfirmationPage() {
  const { orderId } = Route.useSearch()
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-text-h">Confirmação do pedido</h1>
      <p className="text-text mt-2">{orderId ? `Pedido: ${orderId}` : 'Pedido em processamento...'}</p>
      <p className="text-sm text-muted-foreground mt-4">Em implementação (Fase 5).</p>
    </div>
  )
}
