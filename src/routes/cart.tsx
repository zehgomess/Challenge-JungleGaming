import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-text-h">Carrinho</h1>
      <p className="text-text mt-2">Seu carrinho está vazio (em implementação - Fase 4).</p>
      <Link to="/" className="inline-block mt-4 underline text-text-h">Continuar comprando</Link>
    </div>
  )
}
