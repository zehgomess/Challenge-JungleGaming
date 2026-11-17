import { Skeleton } from '@/components/ui/skeleton'

const previewArtwork = '/artworks/emerald-ape-042.webp'

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

export function BootstrapScreen() {
  if (window.location.pathname === '/') return <HomeBootstrapScreen />

  return (
    <main className="bootstrap-route" role="status" aria-live="polite">
      <Brand />
      <Skeleton className="h-8 w-48" />
      <span>Carregando sua experiência...</span>
    </main>
  )
}
