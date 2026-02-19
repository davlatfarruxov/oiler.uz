import api from './axios'

// Types
export interface UnifiedHistoryItem {
  id: string
  type: 'oilChange' | 'service'
  date: string
  serviceName?: string
  items: string[]
  price: number
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  amountDue: number
  employees: Array<{ _id: string; name: string }>
  mileage?: number
  // Additional fields for display
  oilProduct?: any
  oilFilter?: any
  airFilter?: any
  cabinFilter?: any
  fuelFilter?: any
  serviceItems?: any[]
  laborCost?: number
  notes?: string
}

// Vehicle API functions
export const getVehicleHistory = async (vehicleId: string) => {
  const response = await api.get(`/vehicles/${vehicleId}/unified-history`)
  return response.data
}
