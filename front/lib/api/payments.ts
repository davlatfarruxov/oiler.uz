import api from './axios'

// Types
export interface RecordPaymentData {
  customerId: string
  serviceType: 'oilChange' | 'service'
  oilChangeId?: string
  serviceId?: string
  amount: number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check' | 'other'
  notes?: string
}

// Payment API functions
export const recordPayment = async (data: RecordPaymentData) => {
  const response = await api.post('/payments', data)
  return response.data
}

export const getCustomerPaymentHistory = async (customerId: string) => {
  const response = await api.get(`/payments/customer/${customerId}/history`)
  return response.data
}

export const getCustomerDebtSummary = async (customerId: string) => {
  const response = await api.get(`/payments/customer/${customerId}/summary`)
  return response.data
}
