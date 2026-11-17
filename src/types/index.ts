export interface NFT {
  id: string
  name: string
  description: string
  image: string
  gallery?: string[]
  edition: string
  price: string // ETH as decimal string
  availability: number
  total_supply: number
  creator: string
  royalties: number
  created_at: string
  updated_at: string
  is_favorited?: boolean
}

export interface NFTListResponse {
  items: NFT[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  created_at: string
}

export interface Wallet {
  id: string
  address: string
  network: string
  is_primary: boolean
  label?: string
}

export interface CartItem {
  nft_id: string
  edition: string
  quantity: number
  price_at_add: string
  name?: string
  image?: string
  max_availability?: number
}

export interface CartQuote {
  items: Array<CartItem & { unit_price: string; line_total: string; available: number }>
  subtotal: string
  discount: string
  network_fee: string
  total: string
  coupon_code?: string
  coupon_valid?: boolean
  coupon_error?: string
}

export interface Order {
  id: string
  user_id?: string
  status: 'pending' | 'confirmed' | 'refused' | 'cancelled'
  items: CartItem[]
  subtotal: string
  discount: string
  network_fee: string
  total: string
  coupon_code?: string
  transaction_hash?: string
  idempotency_key?: string
  wallet_id?: string
  network?: string
  created_at: string
  updated_at: string
}

export interface CouponValidation {
  valid: boolean
  discount_percentage?: number
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  filter?: string
  sort?: string
  order?: 'asc' | 'desc'
}
