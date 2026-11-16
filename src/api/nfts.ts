import { api } from './client'
import type { NFT, NFTListResponse, PaginationParams } from '@/types'

export const nftApi = {
  list: (params: PaginationParams = {}) =>
    api.get<NFTListResponse>('/nfts', { params }),

  get: (id: string) => api.get<NFT>(`/nfts/${id}`),

  favorite: (id: string) => api.post(`/nfts/${id}/favorite`),

  unfavorite: (id: string) => api.delete(`/nfts/${id}/favorite`),
}