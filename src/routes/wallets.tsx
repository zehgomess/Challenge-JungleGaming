import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { requireAuth } from '@/lib/auth'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useSession } from '@/store/session'
import type { Wallet } from '@/types'

export const Route = createFileRoute('/wallets')({
  beforeLoad: ({ location }) => {
    requireAuth(location.href)
  },
  component: WalletsPage,
})

function WalletsPage() {
  const qc = useQueryClient()
  const { user } = useSession()
  const { data } = useQuery({ queryKey: ['wallets', user?.id], queryFn: () => authApi.wallets() })
  const wallets = data?.data.wallets ?? []
  const [form, setForm] = useState({ address: '', network: 'Ethereum', label: '', is_primary: false })
  const [editing, setEditing] = useState<string | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)

  const isValidAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address.trim())

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) return authApi.updateWallet(editing, form)
      return authApi.addWallet(form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] })
      toast.success(editing ? 'Carteira atualizada' : 'Carteira cadastrada')
      setForm({ address: '', network: 'Ethereum', label: '', is_primary: false })
      setEditing(null)
    },
    onError: () => toast.error('Não foi possível salvar a carteira'),
  })

  const setPrimary = useMutation({
    mutationFn: (id: string) => authApi.updateWallet(id, { is_primary: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallets'] }),
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold text-text-h">Carteiras</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">{editing ? 'Editar carteira' : 'Cadastrar carteira'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={form.address}
                aria-invalid={!!addressError}
                aria-describedby={addressError ? 'wallet-address-error' : undefined}
                onChange={(e) => {
                  setForm((f) => ({ ...f, address: e.target.value }))
                  if (addressError) setAddressError(null)
                }}
                placeholder="0x..."
              />
              {addressError && <p id="wallet-address-error" role="alert" className="text-xs text-destructive mt-1">{addressError}</p>}
            </div>
            <div>
              <Label htmlFor="label">Rótulo</Label>
              <Input id="label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Minha carteira" />
            </div>
            <div>
              <Label htmlFor="network">Rede</Label>
              <select id="network" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.network} onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}>
                <option>Ethereum</option><option>Polygon</option><option>Arbitrum</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_primary} onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))} /> Definir como carteira primária</label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!isValidAddress(form.address)) {
                  setAddressError('Informe um endereço EVM válido (0x seguido de 40 caracteres hexadecimais).')
                  return
                }
                setAddressError(null)
                saveMutation.mutate()
              }}
              disabled={!form.address || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm({ address: '', network: 'Ethereum', label: '', is_primary: false }) }}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Carteiras registradas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {wallets.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma carteira cadastrada.</p>}
          {wallets.map((w: Wallet) => (
            <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-md p-3">
              <div>
                <p className="font-medium text-sm">{w.label || 'Carteira'} {w.is_primary && <span className="text-xs text-green-700">(Primária)</span>}</p>
                <p className="text-xs font-mono text-muted-foreground break-all">{w.address}</p>
                <p className="text-xs text-muted-foreground">{w.network}</p>
              </div>
              <div className="flex gap-2">
                {!w.is_primary && <Button size="sm" variant="outline" onClick={() => setPrimary.mutate(w.id)}>Tornar primária</Button>}
                <Button size="sm" variant="outline" onClick={() => { setEditing(w.id); setForm({ address: w.address, network: w.network, label: w.label || '', is_primary: !!w.is_primary }) }}>Editar</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
