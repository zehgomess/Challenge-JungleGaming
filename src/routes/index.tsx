import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { nftApi } from '@/api/nfts'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSession } from '@/store/session'

type HomeSearch = {
  search?: string
  edition?: string
  availability?: 'available' | 'soldout'
  sort?: 'recent' | 'price' | 'name'
  order?: 'asc' | 'desc'
  page?: number
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const pageNum = Number(search.page)
    return {
      search: typeof search.search === 'string' && search.search ? search.search : undefined,
      edition: typeof search.edition === 'string' && search.edition ? search.edition : undefined,
      availability:
        search.availability === 'available' || search.availability === 'soldout'
          ? search.availability
          : undefined,
      sort:
        search.sort === 'price' || search.sort === 'name' || search.sort === 'recent'
          ? search.sort
          : 'recent',
      order: search.order === 'asc' || search.order === 'desc' ? search.order : 'desc',
      page: Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1,
    }
  },
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const queryUserId = user?.id ?? 'anonymous'
  const searchState = Route.useSearch()
  const { search = '', edition, availability, sort = 'recent', order = 'desc', page = 1 } = searchState

  const query = useQuery({
    queryKey: ['nfts', queryUserId, { search, edition, availability, sort, order, page }],
    queryFn: ({ signal }) =>
      nftApi.list({ search: search || undefined, edition, availability, sort, order, page, limit: 8 } as any, {
        signal,
      } as any),
    placeholderData: keepPreviousData,
  })

  const updateSearch = (patch: Partial<HomeSearch>, resetPage = true) => {
    void queryClient.cancelQueries({ queryKey: ['nfts', queryUserId] })
    navigate({
      to: '/',
      search: (prev) => ({
        ...prev,
        ...patch,
        page: resetPage ? 1 : patch.page ?? (prev as any).page ?? 1,
      }),
    })
  }

  const items = query.data?.data.items ?? []
  const total = query.data?.data.total ?? 0
  const limit = query.data?.data.limit ?? 8
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const highlights = items.slice(0, 3)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      <section>
        <h1 className="text-2xl font-heading font-bold text-text-h">Marketplace de NFTs</h1>
        <p className="text-text">Descubra, colecione e negocie NFTs exclusivos</p>
      </section>

      <section aria-label="Destaques">
        <h2 className="text-lg font-semibold mb-3">Destaques</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(query.isLoading ? Array.from({ length: 3 }) : highlights).map((nft: any, idx) => (
            <Card key={nft?.id ?? idx} className="overflow-hidden">
              {query.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="block">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    width={600}
                    height={400}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="h-40 w-full object-cover"
                  />
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{nft.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{nft.description}</CardDescription>
                  </CardHeader>
                </Link>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Catálogo" className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <div>
              <label className="text-sm font-medium" htmlFor="search">Busca</label>
              <Input
                id="search"
                value={search}
                placeholder="Nome ou descrição"
                onChange={(e) => updateSearch({ search: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="edition">Edição</label>
              <select
                id="edition"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={edition ?? ''}
                onChange={(e) => updateSearch({ edition: e.target.value || undefined })}
              >
                <option value="">Todas</option>
                <option value="Standard">Standard</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="availability">Disponibilidade</label>
              <select
                id="availability"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={availability ?? ''}
                onChange={(e) => updateSearch({ availability: (e.target.value || undefined) as any })}
              >
                <option value="">Todas</option>
                <option value="available">Disponível</option>
                <option value="soldout">Esgotado</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="sort">Ordenação</label>
              <select
                id="sort"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={`${sort}:${order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split(':') as [HomeSearch['sort'], HomeSearch['order']]
                  updateSearch({ sort: s, order: o })
                }}
              >
                <option value="recent:desc">Mais recentes</option>
                <option value="recent:asc">Mais antigos</option>
                <option value="price:asc">Preço: menor</option>
                <option value="price:desc">Preço: maior</option>
                <option value="name:asc">Nome: A-Z</option>
                <option value="name:desc">Nome: Z-A</option>
              </select>
            </div>
          </div>
          {query.isFetching && !query.isLoading && <span className="text-sm text-muted-foreground">Atualizando...</span>}
        </div>

        {query.isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        )}

        {query.isError && (
          <div className="p-6 text-center border rounded-lg">
            <h3 className="text-text-h font-medium">Erro ao carregar catálogo</h3>
            <p className="text-sm text-muted-foreground mt-1">Tente novamente em instantes.</p>
            <Button className="mt-4" onClick={() => query.refetch()}>Tentar novamente</Button>
          </div>
        )}

        {!query.isLoading && !query.isError && items.length === 0 && (
          <div className="p-10 text-center border rounded-lg">
            <h3 className="text-text-h font-medium">Nenhum NFT encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros ou a busca para ver outros resultados.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate({ to: '/', search: {} as any })}>
              Limpar filtros
            </Button>
          </div>
        )}

        {!query.isLoading && !query.isError && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((nft) => (
                <Card key={nft.id} className="h-full flex flex-col">
                  <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="block">
                    <CardHeader>
                      <div className="aspect-square bg-muted overflow-hidden rounded-lg">
                        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <CardTitle className="text-sm mt-2">{nft.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{nft.description}</CardDescription>
                    </CardHeader>
                  </Link>
                  <CardFooter className="mt-auto flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-h">{nft.price} ETH</span>
                      <Badge variant="secondary" className="text-xs w-fit">{nft.edition}</Badge>
                    </div>
                    <Badge variant={nft.availability > 0 ? 'default' : 'outline'}>
                      {nft.availability > 0 ? `${nft.availability} disp.` : 'Esgotado'}
                    </Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} · {total} itens
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => updateSearch({ page: page - 1 }, false)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => updateSearch({ page: page + 1 }, false)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
