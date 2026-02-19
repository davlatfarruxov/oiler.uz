import api from './axios'

// Types
export interface UniversalInventoryItem {
  _id: string
  tenant: string
  name: string
  partNumber?: string
  brand?: string
  category: string
  price: number
  stock: number
  unit: string
  description?: string
  reorderLevel: number
  needsReorder?: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryFilters {
  category?: string
  search?: string
}

// Inventory API functions
export const listInventory = async (filters?: InventoryFilters) => {
  const response = await api.get('/inventory', { params: filters })
  return response.data
}
