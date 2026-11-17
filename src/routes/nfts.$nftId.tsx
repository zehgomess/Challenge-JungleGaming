import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
  const [quantitySelection, setQuantitySelection] = useState({ nftId, quantity: 1 })
  const [gallerySelection, setGallerySelection] = useState({ nftId, index: 0 })
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAuthenticated, user } = useSession()
  const queryUserId = user?.id ?? 'anonymous'
  const nftQueryKey = ['nft', queryUserId, nftId]
  const nftListQueryKey = ['nfts', queryUserId]
  const { addItem } = useCart()

  const query = useQuery({
    queryKey: nftQueryKey,
    queryFn: ({ signal }) => nftApi.get(nftId, { signal } as any),
  })

  const favMutation = useMutation({
    mutationFn: async (fav: boolean) => {
      if (!isAuthenticated) throw new Error('AUTH_REQUIRED')
      return fav ? nftApi.favorite(nftId) : nftApi.unfavorite(nftId)
    },
    onMutate: async (fav: boolean) => {
      await qc.cancelQueries({ queryKey: nftQueryKey })
      const prevNft = qc.getQueryData(nftQueryKey)
      const prevList = qc.getQueriesData({ queryKey: nftListQueryKey })
      qc.setQueryData(nftQueryKey, (old: any) => {
        if (!old) return old
        const data = old.data ? { ...old.data, is_favorited: fav } : old
        return old.data ? { ...old, data } : data
      })
      qc.setQueriesData({ queryKey: nftListQueryKey }, (old: any) => {
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
      if (ctx?.prevNft) qc.setQueryData(nftQueryKey, ctx.prevNft)
      if (ctx?.prevList) for (const [key, data] of ctx.prevList) qc.setQueryData(key, data)
      if (e?.message === 'AUTH_REQUIRED') {
        toast.error('Faça login para favoritar')
        navigate({ to: '/login', search: { returnTo: `/nfts/${nftId}` } })
        return
      }
      toast.error('Não foi possível atualizar favorito')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: nftQueryKey })
      qc.invalidateQueries({ queryKey: nftListQueryKey })
    },
  })
  if (query.isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-16 w-full mt-3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-7 w-24" />
            </div>
            <Card>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (query.isError || !query.data) {
    const status = (query.error as any)?.response?.status
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-heading font-bold text-text-h">
          {status === 404 ? 'NFT não encontrado' : 'Erro ao carregar NFT'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {status === 404
            ? 'Este item pode ter sido removido ou o link está incorreto.'
            : 'Tente novamente em instantes.'}
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          {status !== 404 && <Button onClick={() => query.refetch()}>Tentar novamente</Button>}
          <Button variant="outline" asChild>
            <Link to="/">Voltar ao catálogo</Link>
          </Button>
        </div>
      </div>
    )
  }

  const nft = query.data.data
  const unavailable = nft.availability <= 0
  const galleryImages = Array.from(new Set([nft.image, ...(nft.gallery ?? [])]))
  const galleryIndex =
    gallerySelection.nftId === nftId
      ? Math.min(gallerySelection.index, galleryImages.length - 1)
      : 0
  const maxQuantity = Math.max(1, nft.availability)
  const selectedQuantity = Math.min(
    quantitySelection.nftId === nftId ? quantitySelection.quantity : 1,
    maxQuantity,
  )

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <Link to="/" className="text-sm underline text-muted-foreground">← Voltar ao catálogo</Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={galleryImages[galleryIndex]}
              alt={nft.name}
              width={600}
              height={600}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Galeria de imagens do NFT">
              {galleryImages.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  aria-label={`Ver imagem ${index + 1} de ${galleryImages.length}`}
                  aria-pressed={galleryIndex === index}
                  onClick={() => setGallerySelection({ nftId, index })}
                  className={`overflow-hidden rounded-md border ${galleryIndex === index ? 'border-primary' : 'border-transparent'}`}
                >
                  <img
                    src={src}
                    alt=""
                    width={150}
                    height={150}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
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
            <Badge variant="secondary">Edição: {nft.edition}</Badge>
            <Badge variant={unavailable ? 'outline' : 'default'}>
              {unavailable ? 'Esgotado' : `${nft.availability} disponível(is)`}
            </Badge>
            <Badge variant="secondary">Royalties: {nft.royalties}%</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span>Preço</span><strong>{nft.price} ETH</strong></div>
              <div className="flex justify-between"><span>Criador</span><span className="font-mono">{nft.creator}</span></div>
              <div className="flex justify-between"><span>Supply</span><span>{nft.total_supply}</span></div>
              <div className="flex justify-between"><span>ID</span><span className="font-mono">{nft.id}</span></div>
            </CardContent>
          </Card>

          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Quantidade</span>
              <div className="flex items-center gap-2" role="group" aria-label="Quantidade de NFTs">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Diminuir quantidade"
                  disabled={unavailable || selectedQuantity <= 1}
                  onClick={() => setQuantitySelection({ nftId, quantity: selectedQuantity - 1 })}
                >
                  <span aria-hidden="true">−</span>
                </Button>
                <output
                  className="min-w-10 text-center font-semibold text-text-h"
                  aria-label="Quantidade selecionada"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {selectedQuantity}
                </output>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Aumentar quantidade"
                  disabled={unavailable || selectedQuantity >= nft.availability}
                  onClick={() =>
                    setQuantitySelection({ nftId, quantity: Math.min(selectedQuantity + 1, nft.availability) })
                  }
                >
                  <span aria-hidden="true">+</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo de {nft.availability} por compra
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              disabled={unavailable}
              className="flex-1"
              onClick={() => {
                addItem({
                  nft_id: nft.id,
                  edition: nft.edition,
                  quantity: selectedQuantity,
                  price_at_add: nft.price,
                  name: nft.name,
                  image: nft.image,
                  max_availability: nft.availability,
                })
                toast.success('Item adicionado ao carrinho')
              }}
            >
              {unavailable ? 'Edição indisponível' : 'Adicionar ao carrinho'}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/cart">Ver carrinho</Link>
            </Button>
          </div>
          {unavailable && (
            <p className="text-sm text-muted-foreground">Esta edição não está disponível no momento. Tente outra edição quando houver reposição.</p>
          )}
        </div>
      </div>
    </div>
  )
}
