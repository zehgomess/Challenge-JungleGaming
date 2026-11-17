import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { requireAuth } from '@/lib/auth'
import { orderApi } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/store/session'
import type { CartItem } from '@/types'

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
  const { user } = useSession()
  const effectiveId = orderId || (typeof window !== 'undefined' ? sessionStorage.getItem('pending_order_id') || undefined : undefined)

  const query = useQuery({
    queryKey: ['order', user?.id ?? 'anonymous', effectiveId],
    queryFn: () => orderApi.get(effectiveId!),
    enabled: !!effectiveId,
    refetchInterval: (q) => (q.state.data?.data.status === 'pending' ? 2000 : false),
  })

  if (!effectiveId) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-heading font-bold">Confirmação do pedido</h1>
        <p className="mt-2 text-muted-foreground">Nenhum pedido em acompanhamento.</p>
        <Button asChild className="mt-4"><Link to="/">Ir para o catálogo</Link></Button>
      </div>
    )
  }

  if (query.isLoading) return <div className="p-6">Carregando pedido...</div>
  if (query.isError || !query.data) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-heading font-bold">Não foi possível recuperar o pedido</h1>
        <p className="mt-2 text-muted-foreground">Tente recarregar a página para reconciliar o estado.</p>
        <div className="mt-4 flex gap-2"><Button onClick={() => query.refetch()}>Tentar novamente</Button><Button variant="outline" asChild><Link to="/">Catálogo</Link></Button></div>
      </div>
    )
  }

  const order = query.data.data
  const statusLabel = order.status === 'confirmed' ? 'Confirmado' : order.status === 'refused' ? 'Recusado' : order.status === 'cancelled' ? 'Cancelado' : 'Pendente'
  const explorer = order.transaction_hash ? `https://explorer.example/tx/${order.transaction_hash}` : null

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold text-text-h">Confirmação do pedido</h1>
        <Badge variant={order.status === 'confirmed' ? 'default' : (order.status === 'refused' || order.status === 'cancelled') ? 'destructive' : 'secondary'}>{statusLabel}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recibo (snapshot do pedido)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Pedido</span><span className="font-mono">{order.id}</span></div>
          <div className="flex justify-between"><span>Status</span><span>{statusLabel}</span></div>
          <div className="flex justify-between"><span>Subtotal</span><span>{order.subtotal} ETH</span></div>
          <div className="flex justify-between"><span>Desconto</span><span>-{order.discount} ETH</span></div>
          <div className="flex justify-between"><span>Taxa de rede</span><span>{order.network_fee} ETH</span></div>
          <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span>{order.total} ETH</span></div>
          {order.transaction_hash && (
            <div className="pt-2 space-y-1">
              <div className="flex justify-between gap-4"><span>Transação (simulada)</span><span className="font-mono text-xs break-all">{order.transaction_hash}</span></div>
              {explorer && <a className="underline text-text-h text-sm" href={explorer} target="_blank" rel="noreferrer">Ver no explorer (simulado)</a>}
            </div>
          )}
          {order.status === 'pending' && <p className="text-muted-foreground">Pedido pendente. O estado será reconciliado automaticamente.</p>}
          {order.status === 'refused' && <p className="text-destructive">Pedido recusado. Seus itens não confirmados permanecem/foram preservados conforme aplicável.</p>}
          {order.status === 'cancelled' && <p className="text-destructive">Pedido cancelado. Seus itens não confirmados permanecem/foram preservados conforme aplicável.</p>}
          {order.status === 'confirmed' && <p className="text-green-700">Compra confirmada com sucesso. Este recibo é um snapshot imutável do pedido.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Itens</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.items.length === 0 ? <p className="text-muted-foreground">Sem itens detalhados.</p> : order.items.map((it: CartItem, idx: number) => (
            <div key={idx} className="flex justify-between"><span>{it.nft_id} ({it.edition}) x{it.quantity}</span><span>{it.price_at_add} ETH</span></div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button asChild><Link to="/">Continuar comprando</Link></Button>
        <Button variant="outline" onClick={() => window.location.reload()}>Atualizar status</Button>
      </div>
    </div>
  )
}
