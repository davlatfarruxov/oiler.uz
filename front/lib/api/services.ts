import api from './axios'

// Types
export interface ServiceItem {
  itemName: string
  itemType: 'inventory' | 'custom'
  inventoryId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface CreateServiceData {
  vehicleId: string
  customerId: string
  serviceName: string
  serviceItems: ServiceItem[]
  laborCost: number
  employees: string[]
  mileage?: number
  notes?: string
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  amountPaid: number
  dueDate?: string
}

export interface UpdateServiceData {
  serviceName?: string
  serviceItems?: ServiceItem[]
  laborCost?: number
  employees?: string[]
  mileage?: number
  notes?: string
  paymentStatus?: 'paid' | 'partial' | 'unpaid'
  amountPaid?: number
  dueDate?: string
}

export interface ServiceFilters {
  vehicleId?: string
  customerId?: string
  paymentStatus?: 'paid' | 'partial' | 'unpaid'
  startDate?: string
  endDate?: string
}

// Service API functions
export const createService = async (data: CreateServiceData) => {
  const response = await api.post('/services', data)
  return response.data
}

export const updateService = async (id: string, data: UpdateServiceData) => {
  const response = await api.put(`/services/${id}`, data)
  return response.data
}

export const getService = async (id: string) => {
  const response = await api.get(`/services/${id}`)
  return response.data
}

export const listServices = async (filters?: ServiceFilters) => {
  const response = await api.get('/services', { params: filters })
  return response.data
}

export const deleteService = async (id: string) => {
  const response = await api.delete(`/services/${id}`)
  return response.data
}

export const archiveService = async (id: string, reason?: string) => {
  const response = await api.post(`/services/${id}/archive`, { reason })
  return response.data
}

export const getServiceHistory = async (id: string) => {
  const response = await api.get(`/services/${id}/archive-history`)
  return response.data
}
