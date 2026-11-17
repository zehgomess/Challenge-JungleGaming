import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { ArrowRight, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
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
  const showDefaultPreview =
    !search && !edition && !availability && sort === 'recent' && order === 'desc' && page === 1

  return (
    <div className="marketplace-page">
      <div className="marketplace-shell">
        <section className="marketplace-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-eyebrow"><Sparkles size={13} /> Bem-vindo à Kurio</p>
            <h1
              id="hero-title"
              aria-label="Marketplace de NFTs: seja dono da cultura digital"
            >
              Seja dono da<br className="hidden sm:block" /> cultura digital.
            </h1>
            <p className="hero-description">
              Descubra NFTs selecionados de criadores do mundo todo. Explore um universo feito para colecionar.
            </p>
            <a className="hero-link" href="#collections">
              Explorar coleção <ArrowRight size={15} />
            </a>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="hero-token">K</span>
          </div>
          <div className="hero-pagination" aria-hidden="true"><i /><i /><i /></div>
        </section>

        <section id="collections" aria-label="Coleções" className="collection-section">
          <div className="collection-heading">
            <div>
              <p className="section-kicker">Explore o marketplace</p>
              <h2>Coleções</h2>
            </div>
            <div className="mobile-search">
              <label className="search-field">
                <Search size={16} aria-hidden="true" />
                <Input
                  id="search"
                  aria-label="Busca"
                  value={search}
                  placeholder="Explorar coleções"
                  onChange={(e) => updateSearch({ search: e.target.value || undefined })}
                />
              </label>
              <a className="mobile-filter-link" href="#filters" aria-label="Ir para filtros">
                <SlidersHorizontal size={17} />
              </a>
            </div>
          </div>

          <div className="collection-tabs" role="group" aria-label="Ordenar coleções">
            <button
              type="button"
              className={sort === 'recent' ? 'collection-tab active' : 'collection-tab'}
              onClick={() => updateSearch({ sort: 'recent', order: 'desc' })}
            >
              Todos os NFTs
            </button>
            <button
              type="button"
              className={sort === 'recent' && order === 'asc' ? 'collection-tab active' : 'collection-tab'}
              onClick={() => updateSearch({ sort: 'recent', order: 'asc' })}
            >
              Novos lançamentos
            </button>
            <button
              type="button"
              className={sort === 'price' ? 'collection-tab active' : 'collection-tab'}
              onClick={() => updateSearch({ sort: 'price', order: 'desc' })}
            >
              Em alta
            </button>
          </div>

          <div className="catalog-layout">
            <aside id="filters" className="catalog-sidebar" aria-label="Filtros do catálogo">
              <h3>Filtros</h3>
              <div className="filter-field">
                <label htmlFor="edition">Edição</label>
                <select
                  id="edition"
                  value={edition ?? ''}
                  onChange={(e) => updateSearch({ edition: e.target.value || undefined })}
                >
                  <option value="">Todas as edições</option>
                  <option value="Standard">Standard</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="availability">Disponibilidade</label>
                <select
                  id="availability"
                  value={availability ?? ''}
                  onChange={(e) => updateSearch({ availability: (e.target.value || undefined) as any })}
                >
                  <option value="">Todas</option>
                  <option value="available">Disponível</option>
                  <option value="soldout">Esgotado</option>
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="sort">Ordenar por</label>
                <select
                  id="sort"
                  value={`${sort}:${order}`}
                  onChange={(e) => {
                    const [nextSort, nextOrder] = e.target.value.split(':') as [
                      HomeSearch['sort'],
                      HomeSearch['order'],
                    ]
                    updateSearch({ sort: nextSort, order: nextOrder })
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
            </aside>

            <div className="catalog-results">
              <div className="catalog-results-heading">
                <div>
                  <h3>Todos os NFTs</h3>
                  <p>{total} itens para descobrir</p>
                </div>
                {query.isFetching && !query.isLoading && <span className="text-sm text-muted-foreground">Atualizando...</span>}
              </div>

              {query.isLoading && (
                <div className="nft-grid">
                  {showDefaultPreview && (
                    <div className="nft-card loading-preview" aria-hidden="true">
                      <div className="nft-card-art">
                        <img
                          src="/artworks/emerald-ape-042.webp"
                          alt=""
                          width={600}
                          height={600}
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                      </div>
                      <CardHeader className="nft-card-header">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="mt-2 h-3 w-1/2" />
                      </CardHeader>
                      <CardFooter className="nft-card-footer">
                        <div className="w-full space-y-2">
                          <Skeleton className="h-3 w-1/3" />
                          <Skeleton className="h-2 w-1/4" />
                        </div>
                      </CardFooter>
                    </div>
                  )}
                  {Array.from({ length: showDefaultPreview ? 7 : 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-72 w-full" />
                  ))}
                </div>
              )}

              {query.isError && (
                <div className="catalog-message">
                  <h3>Erro ao carregar catálogo</h3>
                  <p>Tente novamente em instantes.</p>
                  <Button className="mt-4" onClick={() => query.refetch()}>Tentar novamente</Button>
                </div>
              )}

              {!query.isLoading && !query.isError && items.length === 0 && (
                <div className="catalog-message">
                  <h3>Nenhum NFT encontrado</h3>
                  <p>Ajuste os filtros ou a busca para ver outros resultados.</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate({ to: '/', search: {} as any })}>
                    Limpar filtros
                  </Button>
                </div>
              )}

              {!query.isLoading && !query.isError && items.length > 0 && (
                <>
                  <div className="nft-grid">
                    {items.map((nft, index) => (
                      <Card key={nft.id} className="nft-card">
                        <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="nft-card-link">
                          <div className="nft-card-art">
                            <img
                              src={nft.image}
                              alt={nft.name}
                              width={600}
                              height={600}
                              loading={index === 0 ? 'eager' : 'lazy'}
                              fetchPriority={index === 0 ? 'high' : 'auto'}
                              decoding="async"
                            />
                            {nft.availability <= 0 && <span className="nft-rarity">Esgotado</span>}
                          </div>
                          <CardHeader className="nft-card-header">
                            <CardTitle className="nft-card-title">{nft.name}</CardTitle>
                            <CardDescription className="line-clamp-1">{nft.description}</CardDescription>
                          </CardHeader>
                        </Link>
                        <CardFooter className="nft-card-footer">
                          <div>
                            <span className="nft-price">{nft.price} ETH</span>
                            <span className="nft-edition">{nft.edition}</span>
                          </div>
                          <Badge variant={nft.availability > 0 ? 'default' : 'outline'}>
                            {nft.availability > 0 ? `${nft.availability} disp.` : 'Esgotado'}
                          </Badge>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>

                  <div className="catalog-pagination">
                    <p>Página {page} de {totalPages} · {total} itens</p>
                    <div className="flex gap-2">
                      <Button variant="outline" disabled={page <= 1} onClick={() => updateSearch({ page: page - 1 }, false)}>
                        Anterior
                      </Button>
                      <Button variant="outline" disabled={page >= totalPages} onClick={() => updateSearch({ page: page + 1 }, false)}>
                        Próxima
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
