import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { nftApi } from '@/api/nfts'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['nfts'],
    queryFn: () => nftApi.list(),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-heading font-bold text-text-h mb-6">Marketplace de NFTs</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-text-h">Erro ao carregar catálogo</h2>
        <button onClick={() => window.location.reload()} className="mt-4 text-text-h underline">
          Tentar novamente
        </button>
      </div>
    )
  }

  const items = data?.data?.items ?? []

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-h">Marketplace de NFTs</h1>
          <p className="text-text">Descubra, colecione e negocie NFTs exclusivos</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/cart" className="px-4 py-2 bg-text-h text-bg rounded-md hover:bg-text/80 transition-colors">
            Carrinho
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((nft) => (
          <Card key={nft.id} className="h-full">
            <CardHeader>
              <div className="aspect-square bg-muted overflow-hidden rounded-lg">
                <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
              </div>
              <CardTitle className="text-sm">{nft.name}</CardTitle>
              <CardDescription>{nft.description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-bold text-text-h">{nft.price} ETH</span>
                <Badge variant="secondary" className="text-xs">
                  {nft.edition}
                </Badge>
              </div>
              <Badge>{nft.availability} disponível</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}