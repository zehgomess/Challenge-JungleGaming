import { Link } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSession } from '@/store/session'

export function NavBar() {
  const { isAuthenticated, user, logout } = useSession()

  return (
    <nav className="border-b border-border px-4 py-3 bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
        <Link to="/" className="text-xl font-heading font-bold text-text-h">
          Jungle NFT
        </Link>
        <div className="flex-1 max-w-md hidden sm:block">
          <Input placeholder="Buscar NFTs..." />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/cart" className="text-text hover:text-text-h transition-colors">
            Carrinho
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="text-text hover:text-text-h transition-colors">
                Perfil
              </Link>
              <Link to="/wallets" className="text-text hover:text-text-h transition-colors">
                Carteiras
              </Link>
              <span className="hidden md:inline text-muted-foreground">{user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-text hover:text-text-h transition-colors">
                Login
              </Link>
              <Link to="/register" className="text-text hover:text-text-h transition-colors">
                Cadastro
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}