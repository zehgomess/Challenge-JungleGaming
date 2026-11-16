import { Link } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'

export function NavBar() {
  return (
    <nav className="border-b border-border px-4 py-3 bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-heading font-bold text-text-h">
          Jungle NFT Marketplace
        </Link>
        <div className="flex items-center gap-4">
          <Input placeholder="Buscar NFTs..." className="w-64 md:w-80" />
          <Link to="/cart" className="text-text hover:text-text-h transition-colors">
            Carrinho
          </Link>
          <Link to="/login" className="text-text hover:text-text-h transition-colors">
            Login
          </Link>
        </div>
      </div>
    </nav>
  )
}