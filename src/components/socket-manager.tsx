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

    const isNewer = (key: string, ts?: string) => {
      if (!ts) return true
      const prev = seen.current.get(key)
      if (!prev) {
        seen.current.set(key, ts)
        return true
      }
      if (new Date(ts).getTime() < new Date(prev).getTime()) return false
      if (ts === prev) return false
      seen.current.set(key, ts)
      return true
    }

    const onNftUpdated = (payload: any) => {
      const key = `nft:${payload?.id}:${payload?.version ?? payload?.updated_at ?? ''}`
      if (!isNewer(key, payload?.updated_at || payload?.version)) return
      if (payload?.id) {
        qc.invalidateQueries({ queryKey: ['nft', payload.id] })
      }
      qc.invalidateQueries({ queryKey: ['nfts'] })
      qc.invalidateQueries({ queryKey: ['cart'] })
      toast.message('Atualização em tempo real: NFT atualizado (preço/disponibilidade).')
    }

    const onOrderUpdated = (payload: any) => {
      const id = payload?.orderId || payload?.id
      if (!id) return
      const key = `order:${id}:${payload?.status}:${payload?.updated_at ?? ''}`
      if (!isNewer(key, payload?.updated_at)) return
      qc.invalidateQueries({ queryKey: ['order', id] })
      if (payload?.status === 'confirmed') toast.success('Pedido confirmado em tempo real.')
      else if (payload?.status === 'refused') toast.error('Pedido recusado em tempo real.')
      else toast.message('Status do pedido atualizado.')
    }

    const onConnect = () => {
      // Reconcile active resources with REST after reconnect
      qc.invalidateQueries({ queryKey: ['nfts'] })
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
