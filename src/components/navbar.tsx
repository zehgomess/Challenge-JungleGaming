import { Link } from '@tanstack/react-router'
import { Compass, Home, ShoppingBag, UserRound, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/store/session'

export function NavBar() {
  const { isAuthenticated, user, logout } = useSession()

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand" aria-label="Kurio — início">
            <span className="brand-mark">K</span>
            <span>KURIO</span>
          </Link>

          <nav className="desktop-nav" aria-label="Navegação principal">
            <Link to="/" className="nav-current">Início</Link>
            <a href="/#collections">Mercado</a>
            <Link to="/wallets">Carteiras</Link>
            <Link to="/profile">Perfil</Link>
          </nav>

          <div className="header-actions">
            <Link to="/cart" className="header-cart">
              <ShoppingBag size={17} aria-hidden="true" />
              <span>Carrinho</span>
            </Link>
            {isAuthenticated ? (
              <>
                <span className="header-user">{user?.name}</span>
                <Button variant="outline" size="sm" onClick={logout}>Sair</Button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-login">Login</Link>
                <Button asChild size="sm" className="header-signup">
                  <Link to="/register">Cadastro</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Navegação móvel">
        <Link to="/" activeProps={{ className: 'mobile-nav-item active' }} className="mobile-nav-item">
          <Home size={18} aria-hidden="true" />
          <span>Início</span>
        </Link>
        <a href="/#collections" className="mobile-nav-item">
          <Compass size={18} aria-hidden="true" />
          <span>Explorar</span>
        </a>
        <Link to="/cart" activeProps={{ className: 'mobile-nav-item active' }} className="mobile-nav-item">
          <ShoppingBag size={18} aria-hidden="true" />
          <span>Carrinho</span>
        </Link>
        <Link
          to={isAuthenticated ? '/profile' : '/login'}
          activeProps={{ className: 'mobile-nav-item active' }}
          className="mobile-nav-item"
        >
          <UserRound size={18} aria-hidden="true" />
          <span>{isAuthenticated ? 'Perfil' : 'Login'}</span>
        </Link>
        <Link to="/wallets" className="mobile-nav-item">
          <WalletCards size={18} aria-hidden="true" />
          <span>Carteiras</span>
        </Link>
      </nav>
    </>
  )
}
