import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetail,
})

function NftDetail() {
  const { nftId } = Route.useParams()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading font-bold text-text-h">Detalhe do NFT</h1>
      <p className="text-text mt-2">NFT: {nftId}</p>
      <p className="text-sm text-muted-foreground mt-4">Em implementação (Fase 3).</p>
    </div>
  )
}
