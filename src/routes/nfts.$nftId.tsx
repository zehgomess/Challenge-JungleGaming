import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nftApi } from '@/api/nfts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/store/session'
import { useCart } from '@/store/cart'
import { toast } from 'sonner'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetail,
})

function NftDetail() {
  const { nftId } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAuthenticated } = useSession()
  const { addItem } = useCart()

  const query = useQuery({
    queryKey: ['nft', nftId],
    queryFn: ({ signal }) => nftApi.get(nftId, { signal } as any),
  })

  const favMutation = useMutation({
    mutationFn: async (fav: boolean) => {
      if (!isAuthenticated) throw new Error('AUTH_REQUIRED')
      return fav ? nftApi.favorite(nftId) : nftApi.unfavorite(nftId)
    },
    onMutate: async (fav: boolean) => {
      await qc.cancelQueries({ queryKey: ['nft', nftId] })
      const prevNft = qc.getQueryData(['nft', nftId])
      const prevList = qc.getQueriesData({ queryKey: ['nfts'] })
      qc.setQueryData(['nft', nftId], (old: any) => {
        if (!old) return old
        const data = old.data ? { ...old.data, is_favorited: fav } : old
        return old.data ? { ...old, data } : data
      })
      qc.setQueriesData({ queryKey: ['nfts'] }, (old: any) => {
        const items = old?.data?.data ?? old?.data?.items
        if (!Array.isArray(items)) return old
        const nextItems = items.map((it: any) => (it?.id === nftId ? { ...it, is_favorited: fav } : it))
        if (old?.data?.data) return { ...old, data: { ...old.data, data: nextItems } }
        if (old?.data?.items) return { ...old, data: { ...old.data, items: nextItems } }
        return old
      })
      return { prevNft, prevList }
    },
    onError: (e: any, _fav, ctx) => {
      if (ctx?.prevNft) qc.setQueryData(['nft', nftId], ctx.prevNft)
      if (ctx?.prevList) for (const [key, data] of ctx.prevList) qc.setQueryData(key, data)
      if (e?.message === 'AUTH_REQUIRED') {
        toast.error('FaÃ§a login para favoritar')
        navigate({ to: '/login', search: { returnTo: `/nfts/${nftId}` } })
        return
      }
      toast.error('NÃ£o foi possÃ­vel atualizar favorito')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['nft', nftId] })
      qc.invalidateQueries({ queryKey: ['nfts'] })
    },
  })
  if (query.isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    )
  }

  if (query.isError || !query.data) {
    const status = (query.error as any)?.response?.status
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-heading font-bold text-text-h">
          {status === 404 ? 'NFT nÃ£o encontrado' : 'Erro ao carregar NFT'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {status === 404
            ? 'Este item pode ter sido removido ou o link estÃ¡ incorreto.'
            : 'Tente novamente em instantes.'}
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          {status !== 404 && <Button onClick={() => query.refetch()}>Tentar novamente</Button>}
          <Button variant="outline" asChild>
            <Link to="/">Voltar ao catÃ¡logo</Link>
          </Button>
        </div>
      </div>
    )
  }

  const nft = query.data.data
  const unavailable = nft.availability <= 0

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <Link to="/" className="text-sm underline text-muted-foreground">â† Voltar ao catÃ¡logo</Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[nft.image, nft.image, nft.image, nft.image].map((src, i) => (
              <img key={i} src={src} alt={`${nft.name} miniatura ${i + 1}`} className="aspect-square rounded-md object-cover opacity-80" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-h">{nft.name}</h1>
              <Button
                variant={nft.is_favorited ? 'default' : 'outline'}
                onClick={() => favMutation.mutate(!nft.is_favorited)}
                disabled={favMutation.isPending}
              >
                {nft.is_favorited ? 'Favoritado' : 'Favoritar'}
              </Button>
            </div>
            <p className="text-text mt-2">{nft.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">EdiÃ§Ã£o: {nft.edition}</Badge>
            <Badge variant={unavailable ? 'outline' : 'default'}>
              {unavailable ? 'Esgotado' : `${nft.availability} disponÃ­vel(is)`}
            </Badge>
            <Badge variant="secondary">Royalties: {nft.royalties}%</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">InformaÃ§Ãµes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span>PreÃ§o</span><strong>{nft.price} ETH</strong></div>
              <div className="flex justify-between"><span>Criador</span><span className="font-mono">{nft.creator}</span></div>
              <div className="flex justify-between"><span>Supply</span><span>{nft.total_supply}</span></div>
              <div className="flex justify-between"><span>ID</span><span className="font-mono">{nft.id}</span></div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              disabled={unavailable}
              className="flex-1"
              onClick={() => {
                addItem({
                  nft_id: nft.id,
                  edition: nft.edition,
                  quantity: 1,
                  price_at_add: nft.price,
                  name: nft.name,
                  image: nft.image,
                  max_availability: nft.availability,
                })
                toast.success('Item adicionado ao carrinho')
              }}
            >
              {unavailable ? 'EdiÃ§Ã£o indisponÃ­vel' : 'Adicionar ao carrinho'}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/cart">Ver carrinho</Link>
            </Button>
          </div>
          {unavailable && (
            <p className="text-sm text-muted-foreground">Esta ediÃ§Ã£o nÃ£o estÃ¡ disponÃ­vel no momento. Tente outra ediÃ§Ã£o quando houver reposiÃ§Ã£o.</p>
          )}
        </div>
      </div>
    </div>
  )
}
