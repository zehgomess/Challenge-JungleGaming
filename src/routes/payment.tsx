import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { requireAuth } from '@/lib/auth'
import { useCart } from '@/store/cart'
import { cartApi } from '@/api/cart'
import { authApi } from '@/api/auth'
import { orderApi } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export const Route = createFileRoute('/payment')({
  beforeLoad: ({ location }) => {
    requireAuth(location.href)
  },
  component: PaymentPage,
})

function PaymentPage() {
  const navigate = useNavigate()
  const { items, couponCode, removePurchased } = useCart()
  const [selectedWallet, setSelectedWallet] = useState<string>('')
  const [network, setNetwork] = useState('Ethereum')
  const [walletStatus, setWalletStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'refused'>('disconnected')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [baseQuoteJson, setBaseQuoteJson] = useState<string>('')

  const walletsQuery = useQuery({ queryKey: ['wallets'], queryFn: () => authApi.wallets() })
  const wallets = walletsQuery.data?.data.wallets ?? []

  useEffect(() => {
    if (!selectedWallet && wallets.length) {
      const primary = wallets.find((w: any) => w.is_primary) ?? wallets[0]
      setSelectedWallet(primary.id)
      setNetwork(primary.network || 'Ethereum')
    }
  }, [wallets, selectedWallet])

  const quoteMutation = useMutation({ mutationFn: () => cartApi.quote(items, couponCode) })
  useEffect(() => { if (items.length) quoteMutation.mutate() }, [JSON.stringify(items), couponCode])
  const quote = quoteMutation.data?.data

  useEffect(() => {
    if (quote && !baseQuoteJson) {
      setBaseQuoteJson(JSON.stringify({ subtotal: quote.subtotal, discount: quote.discount, network_fee: quote.network_fee, total: quote.total, coupon_code: quote.coupon_code, items: quote.items.map(i => ({nft_id:i.nft_id,edition:i.edition,quantity:i.quantity,unit_price:i.unit_price,available:i.available})) }))
    }
  }, [quote, baseQuoteJson])

  const changedSinceReview = useMemo(() => {
    if (!quote || !baseQuoteJson) return false
    const now = JSON.stringify({ subtotal: quote.subtotal, discount: quote.discount, network_fee: quote.network_fee, total: quote.total, coupon_code: quote.coupon_code, items: quote.items.map(i => ({nft_id:i.nft_id,edition:i.edition,quantity:i.quantity,unit_price:i.unit_price,available:i.available})) })
    return now !== baseQuoteJson
  }, [quote, baseQuoteJson])

  const connectWallet = async () => {
    setWalletStatus('connecting')
    await new Promise((r) => setTimeout(r, 800))
    // deterministic-ish: refuse if network is Polygon in this mock UI for demo; user can switch
    if (network === 'Polygon') setWalletStatus('refused')
    else setWalletStatus('connected')
  }

  const canSubmit =
    items.length > 0 &&
    !!selectedWallet &&
    walletStatus === 'connected' &&
    agreed &&
    !submitting &&
    !quoteMutation.isPending &&
    !changedSinceReview &&
    !(quote?.items ?? []).some((i) => i.available <= 0 || i.quantity <= 0)

  const handleConfirm = async () => {
    if (!canSubmit || !quote) return
    setSubmitting(true)
    let idempotencyKey = ''
    try {
      // Revalidate price/availability/coupon/fees before confirming
      const fresh = await cartApi.quote(items, couponCode)
      const freshQ = fresh.data
      const now = JSON.stringify({ subtotal: freshQ.subtotal, discount: freshQ.discount, network_fee: freshQ.network_fee, total: freshQ.total, coupon_code: freshQ.coupon_code, items: freshQ.items.map(i => ({nft_id:i.nft_id,edition:i.edition,quantity:i.quantity,unit_price:i.unit_price,available:i.available})) })
      if (baseQuoteJson && now !== baseQuoteJson) {
        setBaseQuoteJson('')
        toast.error('Condições atualizadas. Revise os novos valores antes de confirmar.')
        setSubmitting(false)
        return
      }
      if (freshQ.items.some((i) => i.available <= 0 || i.quantity <= 0)) {
        toast.error('Itens indisponíveis ou quantidade inválida. Revise o carrinho.')
        setSubmitting(false)
        return
      }

      const pendingRaw = sessionStorage.getItem('pending_checkout')
      const pending = pendingRaw ? (JSON.parse(pendingRaw) as { idempotencyKey?: string }) : null
      idempotencyKey = pending?.idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      sessionStorage.setItem('pending_checkout', JSON.stringify({ idempotencyKey, at: Date.now() }))

      const createPayload = {
        items,
        coupon_code: freshQ.coupon_code || couponCode,
        wallet_id: selectedWallet,
        network,
        idempotency_key: idempotencyKey,
      }

      let order
      try {
        const created = await orderApi.create(createPayload)
        order = created.data
      } catch (err) {
        // Recovery path: timeout/failure after possible server-side creation
        const recovered = await orderApi.create(createPayload)
        order = recovered.data
        toast.message('Recuperando pedido pendente com a mesma tentativa...')
      }
      sessionStorage.setItem('pending_order_id', order.id)

      const confirmed = await orderApi.confirm(order.id, { idempotency_key: idempotencyKey })
      const finalOrder = confirmed.data
      if (finalOrder.status === 'confirmed') {
        removePurchased((finalOrder.items || order.items || []).map((i: any) => ({ nft_id: i.nft_id, edition: i.edition, quantity: i.quantity })))
        sessionStorage.removeItem('pending_order_id')
        sessionStorage.removeItem('pending_checkout')
        navigate({ to: '/order/confirmation', search: { orderId: finalOrder.id } })
      } else {
        navigate({ to: '/order/confirmation', search: { orderId: finalOrder.id } })
      }
    } catch (e) {
      // keep pending_checkout/idempotency for a later retry/recovery attempt
      toast.error('Não foi possível concluir o pedido. Tentaremos recuperar a mesma tentativa se ela já tiver sido criada.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-heading font-bold">Pagamento</h1>
        <p className="mt-2 text-muted-foreground">Seu carrinho está vazio.</p>
        <Button asChild className="mt-4"><Link to="/">Voltar ao catálogo</Link></Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-heading font-bold text-text-h">Pagamento</h1>

        <Card>
          <CardHeader><CardTitle className="text-base">Carteira e rede</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="wallet">Carteira registrada</Label>
              <select id="wallet" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={selectedWallet} onChange={(e) => { setSelectedWallet(e.target.value); const w = wallets.find((x:any)=>x.id===e.target.value); if (w?.network) setNetwork(w.network); setWalletStatus('disconnected') }}>
                <option value="">Selecione</option>
                {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.label || w.address} ({w.network}){w.is_primary ? ' • Primária' : ''}</option>)}
              </select>
              {!wallets.length && <p className="text-sm text-muted-foreground mt-1">Nenhuma carteira registrada. Cadastre em <Link to="/wallets" className="underline">Carteiras</Link>.</p>}
            </div>
            <div>
              <Label htmlFor="network">Rede</Label>
              <select id="network" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={network} onChange={(e) => { setNetwork(e.target.value); setWalletStatus('disconnected') }}>
                <option>Ethereum</option>
                <option>Polygon</option>
                <option>Arbitrum</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Simulação: Polygon pode recusar conexão nesta demo.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={connectWallet} disabled={!selectedWallet || walletStatus==='connecting'}>
                {walletStatus === 'connecting' ? 'Conectando...' : 'Simular conexão'}
              </Button>
              {walletStatus === 'connected' && <span className="text-sm text-green-600">Carteira conectada</span>}
              {walletStatus === 'refused' && <span className="text-sm text-destructive">Conexão recusada</span>}
              {walletStatus === 'disconnected' && <span className="text-sm text-muted-foreground">Desconectada</span>}
              {walletStatus !== 'disconnected' && <Button variant="ghost" size="sm" onClick={() => setWalletStatus('disconnected')}>Desconectar</Button>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Revisão do pedido</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(quote?.items ?? items).map((it: any) => (
              <div key={`${it.nft_id}:${it.edition}`} className="flex justify-between text-sm">
                <span>{it.name || it.nft_id} ({it.edition}) x{it.quantity}</span>
                <span>{it.line_total || (Number(it.unit_price || it.price_at_add || 0) * it.quantity).toFixed(2)} ETH</span>
              </div>
            ))}
            {changedSinceReview && (
              <div className="p-3 rounded-md border border-amber-300 bg-amber-50 text-sm">
                Preço, disponibilidade, cupom ou taxas foram atualizados. É necessário revisar e aceitar os novos valores.
                <div className="mt-2"><Button size="sm" variant="outline" onClick={() => { if (quote) setBaseQuoteJson(JSON.stringify({ subtotal: quote.subtotal, discount: quote.discount, network_fee: quote.network_fee, total: quote.total, coupon_code: quote.coupon_code, items: quote.items.map(i => ({nft_id:i.nft_id,edition:i.edition,quantity:i.quantity,unit_price:i.unit_price,available:i.available})) })); }}>Aceitar novos valores</Button></div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm pt-2">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              Confirmo que revisei os valores e condições desta compra simulada.
            </label>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{quote?.subtotal ?? '0.00'} ETH</span></div>
            <div className="flex justify-between"><span>Desconto</span><span>-{quote?.discount ?? '0.00'} ETH</span></div>
            <div className="flex justify-between"><span>Taxa de rede</span><span>{quote?.network_fee ?? '0.00'} ETH</span></div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t"><span>Total</span><span>{quote?.total ?? '0.00'} ETH</span></div>
            <Button className="w-full mt-3" onClick={handleConfirm} disabled={!canSubmit}>
              {submitting ? 'Processando...' : 'Confirmar compra'}
            </Button>
            <Button variant="outline" className="w-full" asChild><Link to="/cart">Voltar ao carrinho</Link></Button>
            <p className="text-xs text-muted-foreground">A confirmação é simulada; o pedido só será considerado confirmado após resposta efetiva da API.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
