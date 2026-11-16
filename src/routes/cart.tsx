import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { useCart } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const { items, updateQuantity, removeItem, couponCode, setCouponCode, clear } = useCart()
  const [couponInput, setCouponInput] = useState(couponCode ?? '')

  useEffect(() => setCouponInput(couponCode ?? ''), [couponCode])

  const quoteMutation = useMutation({
    mutationFn: () => cartApi.quote(items, couponCode),
  })

  useEffect(() => {
    quoteMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items), couponCode])

  const quote = quoteMutation.data?.data
  const total = quote?.total ?? '0.00'

  const hasUnavailable = useMemo(
    () => (quote?.items ?? []).some((it) => it.available <= 0 || it.quantity <= 0),
    [quote],
  )

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-text-h">Carrinho</h1>
          {items.length > 0 && <Button variant="outline" onClick={clear}>Limpar carrinho</Button>}
        </div>

        {items.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="text-text">Seu carrinho está vazio.</p>
              <Link to="/" className="inline-block mt-4 underline text-text-h">Continuar comprando</Link>
            </CardContent>
          </Card>
        )}

        {items.map((it) => {
          const q = quote?.items.find((x) => x.nft_id === it.nft_id && x.edition === it.edition)
          const available = q?.available ?? it.max_availability ?? 0
          const unavailable = available <= 0
          return (
            <Card key={`${it.nft_id}:${it.edition}`}>
              <CardContent className="p-4 flex gap-4 items-center">
                <img src={it.image || q?.image} alt={it.name || q?.name || it.nft_id} className="w-20 h-20 rounded-md object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{it.name || q?.name || it.nft_id}</p>
                  <p className="text-sm text-muted-foreground">Edição: {it.edition}</p>
                  <p className="text-sm">{q?.unit_price ?? it.price_at_add} ETH</p>
                  {unavailable && <p className="text-sm text-destructive">Item indisponível no momento</p>}
                  {!unavailable && available < it.quantity && (
                    <p className="text-sm text-amber-600">Disponibilidade alterada: máx. {available}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => updateQuantity(it.nft_id, it.edition, it.quantity - 1)}>-</Button>
                  <span className="w-8 text-center text-sm">{it.quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => updateQuantity(it.nft_id, it.edition, it.quantity + 1)} disabled={it.quantity >= available && available > 0}>+</Button>
                </div>
                <Button variant="ghost" onClick={() => removeItem(it.nft_id, it.edition)}>Remover</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Cupom</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Código do cupom" />
              <Button
                onClick={() => {
                  setCouponCode(couponInput)
                  toast.message('Cupom atualizado')
                }}
              >
                Aplicar
              </Button>
            </div>
            {couponCode && (
              <Button variant="ghost" size="sm" onClick={() => { setCouponCode(undefined); setCouponInput('') }}>
                Remover cupom
              </Button>
            )}
            {quote?.coupon_code && quote.coupon_valid === false && (
              <p className="text-sm text-destructive">{quote.coupon_error || 'Cupom inválido'}</p>
            )}
            {quote?.coupon_code && quote.coupon_valid && (
              <p className="text-sm text-green-600">Cupom aplicado com sucesso.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{quote?.subtotal ?? '0.00'} ETH</span></div>
            <div className="flex justify-between"><span>Desconto</span><span>-{quote?.discount ?? '0.00'} ETH</span></div>
            <div className="flex justify-between"><span>Taxa de rede</span><span>{quote?.network_fee ?? '0.00'} ETH</span></div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t"><span>Total</span><span>{total} ETH</span></div>
            {quoteMutation.isPending && <p className="text-muted-foreground">Atualizando valores...</p>}
            {quoteMutation.isError && <p className="text-destructive">Falha ao calcular totais.</p>}
            <Button asChild className="w-full mt-2" disabled={items.length === 0 || hasUnavailable || quoteMutation.isPending}>
              <Link to="/payment">Ir para pagamento</Link>
            </Button>
            {hasUnavailable && items.length > 0 && (
              <p className="text-xs text-destructive">Ajuste ou remova itens indisponíveis para continuar.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
