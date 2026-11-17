import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { connectSocket, disconnectSocket, recordSocketEvent } from '@/lib/socket'
import { useSession } from '@/store/session'

export function SocketManager() {
  const qc = useQueryClient()
  const { isAuthenticated, user } = useSession()
  const seen = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    seen.current.clear()
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

    const onNftUpdated = (payload: { id?: string; version?: number; updated_at?: string }) => {
      if (!payload?.id) return
      recordSocketEvent('nft.updated')
      const entityKey = `nft:${payload.id}`
      if (!isNewer(entityKey, payload?.version, payload?.updated_at)) return
      qc.invalidateQueries({ queryKey: ['nft'] })
      qc.invalidateQueries({ queryKey: ['nfts'] })
      qc.invalidateQueries({ queryKey: ['cart'] })
      qc.invalidateQueries({ queryKey: ['cartQuote'] })
      qc.refetchQueries({ queryKey: ['cartQuote'], type: 'active' })
      toast.message('Atualização em tempo real: NFT atualizado (preço/disponibilidade).')
    }

  const onOrderUpdated = (payload: { orderId?: string; id?: string; userId?: string; version?: number; updated_at?: string; status?: string }) => {
    const id = payload?.orderId || payload?.id
    if (!id) return
    if (payload?.userId && payload.userId !== user?.id) return
    recordSocketEvent('order.updated')
      const entityKey = `order:${id}`
      if (!isNewer(entityKey, payload?.version, payload?.updated_at)) return
      qc.invalidateQueries({ queryKey: ['order', user?.id ?? 'anonymous', id] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      if (payload?.status === 'confirmed') toast.success('Pedido confirmado em tempo real.')
      else if (payload?.status === 'refused' || payload?.status === 'cancelled') toast.error('Pedido recusado/cancelado em tempo real.')
      else if (payload?.status !== 'pending') toast.message('Status do pedido atualizado.')
    }

    const onConnect = () => {
      socket.emit('session:identify', { userId: user?.id ?? null })
      // Reconcile active resources with REST after reconnect
      qc.invalidateQueries({ queryKey: ['nfts'] })
      qc.invalidateQueries({ queryKey: ['nft'] })
      qc.invalidateQueries({ queryKey: ['cart'] })
      qc.invalidateQueries({ queryKey: ['order'] })
    }

    socket.on('connect', onConnect)
    socket.on('nft.updated', onNftUpdated)
    socket.on('order.updated', onOrderUpdated)
    if (socket.connected) socket.emit('session:identify', { userId: user?.id ?? null })

    return () => {
      socket.off('connect', onConnect)
      socket.off('nft.updated', onNftUpdated)
      socket.off('order.updated', onOrderUpdated)
      // keep connection for app lifetime in this simple impl; cleanup on full unmount not critical
    }
  }, [qc, isAuthenticated, user?.id])

  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [])

  return null
}
