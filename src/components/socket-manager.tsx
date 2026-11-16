import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { useSession } from '@/store/session'

export function SocketManager() {
  const qc = useQueryClient()
  const { isAuthenticated } = useSession()
  const seen = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    const socket = connectSocket()

    const isNewer = (entityKey: string, version?: number, ts?: string) => {
      const marker = typeof version === 'number' ? `v:${version}` : ts ? `t:${ts}` : null
      if (!marker) return true
      const prev = seen.current.get(entityKey)
      if (!prev) {
        seen.current.set(entityKey, marker)
        return true
      }
      if (prev === marker) return false
      const prevV = prev.startsWith('v:') ? Number(prev.slice(2)) : NaN
      const nextV = marker.startsWith('v:') ? Number(marker.slice(2)) : NaN
      if (Number.isFinite(prevV) && Number.isFinite(nextV)) {
        if (nextV < prevV) return false
      } else if (ts && prev.startsWith('t:')) {
        const prevT = new Date(prev.slice(2)).getTime()
        const nextT = new Date(ts).getTime()
        if (Number.isFinite(prevT) && Number.isFinite(nextT) && nextT < prevT) return false
      }
      seen.current.set(entityKey, marker)
      return true
    }

    const onNftUpdated = (payload: any) => {
      if (!payload?.id) return
      const entityKey = `nft:${payload.id}`
      if (!isNewer(entityKey, payload?.version, payload?.updated_at)) return
      qc.invalidateQueries({ queryKey: ['nft', payload.id] })
      qc.invalidateQueries({ queryKey: ['nfts'] })
      qc.invalidateQueries({ queryKey: ['cart'] })
      qc.invalidateQueries({ queryKey: ['cartQuote'] })
      qc.refetchQueries({ queryKey: ['cartQuote'], type: 'active' })
      toast.message('Atualização em tempo real: NFT atualizado (preço/disponibilidade).')
    }

    const onOrderUpdated = (payload: any) => {
      const id = payload?.orderId || payload?.id
      if (!id) return
      const entityKey = `order:${id}`
      if (!isNewer(entityKey, payload?.version, payload?.updated_at)) return
      qc.invalidateQueries({ queryKey: ['order', id] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      if (payload?.status === 'confirmed') toast.success('Pedido confirmado em tempo real.')
      else if (payload?.status === 'refused') toast.error('Pedido recusado em tempo real.')
      else toast.message('Status do pedido atualizado.')
    }

    const onConnect = () => {
      // Reconcile active resources with REST after reconnect
      qc.invalidateQueries({ queryKey: ['nfts'] })
      qc.invalidateQueries({ queryKey: ['nft'] })
      qc.invalidateQueries({ queryKey: ['cart'] })
      qc.invalidateQueries({ queryKey: ['order'] })
    }

    socket.on('connect', onConnect)
    socket.on('nft.updated', onNftUpdated)
    socket.on('order.updated', onOrderUpdated)

    return () => {
      socket.off('connect', onConnect)
      socket.off('nft.updated', onNftUpdated)
      socket.off('order.updated', onOrderUpdated)
      // keep connection for app lifetime in this simple impl; cleanup on full unmount not critical
    }
  }, [qc, isAuthenticated])

  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [])

  return null
}
