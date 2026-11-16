import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading font-bold text-text-h mb-6">Marketplace de NFTs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4 bg-background">
          <h3 className="font-semibold text-text-h">NFT #1</h3>
          <p className="text-text">Descricao do NFT</p>
        </div>
      </div>
    </div>
  )
}