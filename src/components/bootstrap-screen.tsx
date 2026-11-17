import { Skeleton } from '@/components/ui/skeleton'

const previewArtwork = '/artworks/emerald-ape-042.webp'
const detailArtworks: Record<string, string> = {
  'nft-1': previewArtwork,
  'nft-2': '/artworks/violet-nomad-314.webp',
  'nft-3': '/artworks/ivory-baron-008.webp',
  'nft-4': '/artworks/golden-beat-207.webp',
}

function Brand() {
  return (
    <span className="brand" aria-label="Kurio">
      <span className="brand-mark">K</span>
      <span>KURIO</span>
    </span>
  )
}

function HomeBootstrapScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="site-header" aria-hidden="true">
        <div className="site-header-inner">
          <Brand />
        </div>
      </header>
      <main className="marketplace-page" aria-busy="true">
        <div className="marketplace-shell">
          <section className="marketplace-hero">
            <div className="hero-copy">
              <p className="hero-eyebrow">✧ Bem-vindo à Kurio</p>
              <h1>Seja dono da<br /> cultura digital.</h1>
              <p className="hero-description">
                Descubra NFTs selecionados de criadores do mundo todo. Explore um universo feito para colecionar.
              </p>
              <span className="hero-link">Explorar coleção&nbsp; →</span>
            </div>
            <div className="hero-orbit" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="hero-token">K</span>
            </div>
            <div className="hero-pagination" aria-hidden="true"><i /><i /><i /></div>
          </section>

          <section className="collection-section">
            <div className="collection-heading">
              <div>
                <p className="section-kicker">Explore o marketplace</p>
                <h2>Coleções</h2>
              </div>
              <div className="mobile-search" aria-hidden="true">
                <div className="search-field"><span>⌕</span><span>Explorar coleções</span></div>
                <span className="mobile-filter-link">☷</span>
              </div>
            </div>

            <div className="collection-tabs" aria-hidden="true">
              <span className="collection-tab active">Todos os NFTs</span>
              <span className="collection-tab">Novos lançamentos</span>
              <span className="collection-tab">Em alta</span>
            </div>

            <div className="catalog-layout">
              <aside className="catalog-sidebar" aria-hidden="true">
                <h3>Filtros</h3>
                {['Edição', 'Disponibilidade', 'Ordenar por'].map((label) => (
                  <div className="filter-field" key={label}>
                    <span className="filter-label">{label}</span>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </aside>
              <div className="catalog-results">
                <div className="catalog-results-heading">
                  <div><h3>Todos os NFTs</h3><p>Descubra itens selecionados</p></div>
                </div>
                <div className="nft-grid">
                  <div className="nft-card loading-preview" aria-hidden="true">
                    <div className="nft-card-art">
                      <img
                        src={previewArtwork}
                        alt=""
                        width={600}
                        height={600}
                        fetchPriority="high"
                        decoding="async"
                      />
                    </div>
                    <div className="nft-card-header">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="mt-2 h-3 w-1/2" />
                    </div>
                    <div className="nft-card-footer">
                      <div className="w-full space-y-2">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-2 w-1/4" />
                      </div>
                    </div>
                  </div>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-72 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
        <span className="sr-only" role="status">Carregando o marketplace</span>
      </main>
    </div>
  )
}

function DetailBootstrapScreen({ artwork }: { artwork?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="site-header" aria-hidden="true">
        <div className="site-header-inner"><Brand /></div>
      </header>
      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6" aria-busy="true">
        <span className="text-sm text-muted-foreground">← Voltar ao catálogo</span>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {artwork
                ? <img src={artwork} alt="" width={600} height={600} fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
                : <Skeleton className="w-full h-full" />}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </div>
        <span className="sr-only" role="status">Carregando os detalhes do NFT</span>
      </main>
    </div>
  )
}

export function BootstrapScreen() {
  const path = window.location.pathname
  if (path === '/') return <HomeBootstrapScreen />
  if (path.startsWith('/nfts/')) {
    const nftId = path.split('/').filter(Boolean).at(-1) ?? ''
    return <DetailBootstrapScreen artwork={detailArtworks[nftId]} />
  }

  return (
    <main className="bootstrap-route" role="status" aria-live="polite">
      <Brand />
      <Skeleton className="h-8 w-48" />
      <span>Carregando sua experiência...</span>
    </main>
  )
}
