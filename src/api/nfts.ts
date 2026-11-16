import { api } from './client'
import type { NFT, NFTListResponse, PaginationParams } from '@/types'
import type { AxiosRequestConfig } from 'axios'

export const nftApi = {
  list: (params: PaginationParams & Record<string, any> = {}, config: AxiosRequestConfig = {}) =>
    api.get<NFTListResponse>('/nfts', { ...config, params }),

  get: (id: string, config: AxiosRequestConfig = {}) => api.get<NFT>(`/nfts/${id}`, config),

  favorite: (id: string) => api.post(`/nfts/${id}/favorite`),

  unfavorite: (id: string) => api.delete(`/nfts/${id}/favorite`),
}