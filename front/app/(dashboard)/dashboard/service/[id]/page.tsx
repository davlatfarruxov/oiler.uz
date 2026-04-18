'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api/axios'
import { useTenant } from '@/lib/contexts/TenantContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Plus, Printer, Trash2, History, Monitor } from 'lucide-react'
import { PaymentStatusSelector } from '@/components/PaymentStatusSelector'
import { CustomerDebtCard } from '@/components/CustomerDebtCard'
import { PaymentHistoryTable } from '@/components/PaymentHistoryTable'
import { PaymentRecordingDialog } from '@/components/PaymentRecordingDialog'
import { AddServiceDialog } from '@/components/AddServiceDialog'
import { UnifiedServiceHistory } from '@/components/UnifiedServiceHistory'
import { EditServiceDialog } from '@/components/EditServiceDialog'
import { EmployeeCommissionControl } from '@/components/EmployeeCommissionControl'
import { ServicePrintReceipt } from '@/components/ServicePrintReceipt'
import { useCanShowSection } from '@/lib/uiPermissions'

type FilterLike = {
  displayName?: string
  brandName?: string
  brand?: string
  partNumber?: string
  price?: number
  stock?: number
  compatibleVehicles?: string[]
}

function filterPrimaryName(filter: FilterLike): string {
  if (filter.displayName) return filter.displayName
  const b = filter.brandName || filter.brand || ''
  const p = filter.partNumber || ''
  return `${b} ${p}`.trim() || '—'
}

/** Tanlash ro‘yxatida: filter nomi, narx/ombor, mos keladigan mashinalar (omborda bo‘lsa) */
function filterSelectItemLabel(filter: FilterLike, variant: 'withPrice' | 'stockOnly'): string {
  const name = filterPrimaryName(filter)
  const mid =
    variant === 'withPrice'
      ? ` - ${(filter.price || 0).toLocaleString()} so'm (${filter.stock ?? 0} omborda)`
      : ` (Ombor: ${filter.stock ?? 0})`
  const v = filter.compatibleVehicles
  if (!Array.isArray(v) || v.length === 0) return `${name}${mid}`
  const list = v.slice(0, 6).join(', ')
  const more = v.length > 6 ? '…' : ''
  return `${name}${mid} · Mos: ${list}${more}`
}

export default function VehicleDetailPage() {
  
  const params = useParams()
  const router = useRouter()
  const [fromRegister, setFromRegister] = useState(false)
  const { tenant } = useTenant()
  const canSection = useCanShowSection()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOilChangeDialog, setShowOilChangeDialog] = useState(false)
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [showEditGeneralServiceDialog, setShowEditGeneralServiceDialog] = useState(false)
  const [editingGeneralServiceId, setEditingGeneralServiceId] = useState<string>('')
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [printType, setPrintType] = useState<'sticker' | 'receipt'>('receipt')
  const [isSaving, setIsSaving] = useState(false)
  const [lastServiceData, setLastServiceData] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [showAdditionalProducts, setShowAdditionalProducts] = useState(false)
  const [showEditVehicle, setShowEditVehicle] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [editEngineType, setEditEngineType] = useState('')
  const [employeeCommissions, setEmployeeCommissions] = useState<any[]>([])
  const [showEditService, setShowEditService] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [editServiceOilProductId, setEditServiceOilProductId] = useState('')
  const [editServiceOilFilterId, setEditServiceOilFilterId] = useState('')
  const [editServiceAirFilterId, setEditServiceAirFilterId] = useState('')
  const [editServiceCabinFilterId, setEditServiceCabinFilterId] = useState('')
  const [editServiceFuelFilterId, setEditServiceFuelFilterId] = useState('')
  const [editServiceEmployeeIds, setEditServiceEmployeeIds] = useState<string[]>([])
  const [editServiceOilProductCustomerProvided, setEditServiceOilProductCustomerProvided] = useState(false)
  const [editServiceOilFilterCustomerProvided, setEditServiceOilFilterCustomerProvided] = useState(false)
  const [editServiceAirFilterCustomerProvided, setEditServiceAirFilterCustomerProvided] = useState(false)
  const [editServiceCabinFilterCustomerProvided, setEditServiceCabinFilterCustomerProvided] = useState(false)
  const [editServiceLaborCost, setEditServiceLaborCost] = useState(0)
  const [editServiceFuelFilterCustomerProvided, setEditServiceFuelFilterCustomerProvided] = useState(false)

  // Customer debt state
  const [debtSummary, setDebtSummary] = useState<any>(null)
  const [loadingDebt, setLoadingDebt] = useState(false)
  
  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false)
  const [paymentHistoryPage, setPaymentHistoryPage] = useState(1)
  const [paymentHistoryTotalPages, setPaymentHistoryTotalPages] = useState(1)
  const [paymentHistoryTotal, setPaymentHistoryTotal] = useState(0)
  
  // Payment recording dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [completingServiceId, setCompletingServiceId] = useState<string>('')
  const [completingServiceData, setCompletingServiceData] = useState<any>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // Form data from backend
  const [oilFilters, setOilFilters] = useState<any[]>([])
  const [airFilters, setAirFilters] = useState<any[]>([])
  const [cabinFilters, setCabinFilters] = useState<any[]>([])
  const [fuelFilters, setFuelFilters] = useState<any[]>([])
  const [additionalProducts, setAdditionalProducts] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [oilProducts, setOilProducts] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    oilProductId: '',
    oilProductCustomerProvided: false,
    oilProductCustomerProvidedDetails: '',
    oilQuantityUsed: '',
    // Oil Filter
    oilFilterId: '',
    oilFilterCustomerProvided: false,
    oilFilterCustomerProvidedDetails: '',
    // Air Filter
    airFilterId: '',
    airFilterCustomerProvided: false,
    airFilterCustomerProvidedDetails: '',
    // Cabin Filter
    cabinFilterId: '',
    cabinFilterCustomerProvided: false,
    cabinFilterCustomerProvidedDetails: '',
    // Fuel Filter
    fuelFilterId: '',
    fuelFilterCustomerProvided: false,
    fuelFilterCustomerProvidedDetails: '',
    additionalProducts: [] as string[],
    // Custom products (manually entered)
    customProducts: [] as Array<{ name: string; price: string }>,
    employeeIds: [] as string[],
    mileage: '',
    nextServiceMileage: '',
    laborCost: '',
    notes: '',
    // Payment fields
    paymentStatus: 'unpaid' as 'paid' | 'partial' | 'unpaid',
    amountPaid: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchVehicleData()
    fetchFormData()
    fetchCompanySettings()
  }, [params.id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search)
    setFromRegister(q.get('from') === 'register')
  }, [])

  // Reset employee commissions when editing service employees change
  useEffect(() => {
    if (editingService && editServiceEmployeeIds.length > 0) {
      // Initialize commissions for selected employees
      const selectedEmployees = employees.filter(emp => editServiceEmployeeIds.includes(emp._id))
      const existingCommissions = editingService.employeeCommissions || []
      
      const initialCommissions = selectedEmployees.map(emp => {
        const existing = existingCommissions.find((c: any) => c.employee === emp._id || c.employee._id === emp._id)
        return {
          employee: emp._id,
          commissionRate: existing?.commissionRate || emp.commissionRate,
          commissionAmount: existing?.commissionAmount || ((editingService.laborCost || 0) * (existing?.commissionRate || emp.commissionRate) / 100)
        }
      })
      
      setEmployeeCommissions(initialCommissions)
    } else {
      setEmployeeCommissions([])
    }
  }, [editServiceEmployeeIds, editingService, employees])

  const fetchVehicleData = async () => {
    try {
      setIsLoading(true)
      // Fetch vehicle info
      const vehicleResponse = await api.get(`/vehicles/${params.id}`)
      const vehicleData = vehicleResponse.data.data
      
      // Set data with vehicle info
      setData({
        vehicle: vehicleData,
        oilChanges: [], // Will be populated by UnifiedServiceHistory
        totalServices: 0, // Will be calculated from unified history
        lastService: null // Will be calculated from unified history
      })
      
      // Fetch customer debt summary
      if (vehicleData?.customer?._id) {
        fetchDebtSummary(vehicleData.customer._id)
      }
    } catch (error) {
      alert('Failed to load vehicle data')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const response = await api.get('/settings')
      setCompanySettings(response.data?.data || response.data || {})
    } catch (error) {
      console.error('Failed to load company settings:', error)
      setCompanySettings({}) // Set empty object as fallback
    }
  }

  const fetchDebtSummary = async (customerId: string) => {
    try {
      setLoadingDebt(true)
      const response = await api.get(`/payments/customer/${customerId}/summary`)
      setDebtSummary(response.data.data)
      
      // Don't fetch payment history here - it will be lazy loaded when dropdown opens
    } catch (error) {
      console.error('Failed to load debt summary:', error)
    } finally {
      setLoadingDebt(false)
    }
  }

  const fetchPaymentHistory = async (customerId: string, page: number = 1) => {
    try {
      setLoadingPaymentHistory(true)
      const response = await api.get(`/payments/customer/${customerId}/history?page=${page}&limit=20`)
      const result = response.data.data
      
      setPaymentHistory(result.transactions || [])
      setPaymentHistoryPage(result.page || 1)
      setPaymentHistoryTotalPages(result.totalPages || 1)
      setPaymentHistoryTotal(result.total || 0)
    } catch (error) {
      console.error('Failed to load payment history:', error)
    } finally {
      setLoadingPaymentHistory(false)
    }
  }

  const calculateTotalPrice = () => {
    let total = Number(formData.laborCost) || 0
    
    // Add oil product price
    if (!formData.oilProductCustomerProvided && formData.oilProductId) {
      const oilProduct = oilProducts.find(p => p._id === formData.oilProductId)
      if (oilProduct) {
        total += (oilProduct.price || 0) * (Number(formData.oilQuantityUsed) || 1)
      }
    }
    
    // Add filter prices
    if (!formData.oilFilterCustomerProvided && formData.oilFilterId) {
      const filter = oilFilters.find(f => f._id === formData.oilFilterId)
      if (filter) total += filter.price || 0
    }
    
    if (!formData.airFilterCustomerProvided && formData.airFilterId) {
      const filter = airFilters.find(f => f._id === formData.airFilterId)
      if (filter) total += filter.price || 0
    }
    
    if (!formData.cabinFilterCustomerProvided && formData.cabinFilterId) {
      const filter = cabinFilters.find(f => f._id === formData.cabinFilterId)
      if (filter) total += filter.price || 0
    }
    
    if (!formData.fuelFilterCustomerProvided && formData.fuelFilterId) {
      const filter = fuelFilters.find(f => f._id === formData.fuelFilterId)
      if (filter) total += filter.price || 0
    }
    
    // Add additional products
    formData.additionalProducts.forEach(productId => {
      const product = additionalProducts.find(p => p._id === productId)
      if (product) total += product.price || 0
    })
    
    return total
  }

  // Lazy load payment history when dropdown opens
  useEffect(() => {
    if (showPaymentHistory && data?.vehicle?.customer?._id && paymentHistory.length === 0) {
      fetchPaymentHistory(data.vehicle.customer._id, 1)
    }
  }, [showPaymentHistory])

  const handleDeleteVehicle = async () => {
    if (!confirm('Are you sure you want to delete this vehicle? It will be moved to archive.')) return

    try {
      await api.post(`/vehicles/${params.id}/archive`, {
        reason: 'Deleted from vehicle detail page'
      })
      alert('Vehicle deleted successfully')
      router.push('/dashboard/service')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete vehicle')
    }
  }

  const handleViewHistory = async () => {
    try {
      setLoadingHistory(true)
      setShowHistory(true)
      
      const response = await api.get(`/vehicles/${params.id}/archive-history`)
      console.log('Vehicle history:', response.data)
      setHistoryData(response.data.data || [])
    } catch (error) {
      console.error('Failed to load history:', error)
      alert('Failed to load history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleViewServiceHistory = async (serviceId: string) => {
    try {
      setLoadingHistory(true)
      setShowHistory(true)
      
      const response = await api.get(`/oil-changes/${serviceId}/archive-history`)
      console.log('Service history:', response.data)
      setHistoryData(response.data.data || [])
    } catch (error) {
      console.error('Failed to load history:', error)
      alert('Failed to load history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleViewGeneralServiceHistory = async (serviceId: string) => {
    try {
      setLoadingHistory(true)
      setShowHistory(true)
      
      const response = await api.get(`/services/${serviceId}/archive-history`)
      console.log('General service history:', response.data)
      setHistoryData(response.data.data || [])
    } catch (error) {
      console.error('Failed to load history:', error)
      alert('Tarixni yuklashda xatolik yuz berdi')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleCompleteService = async (serviceId: string) => {
    try {
      // First, try to fetch as general service
      try {
        const response = await api.get(`/services/${serviceId}`)
        const serviceData = response.data.data
        
        setCompletingServiceId(serviceId)
        setCompletingServiceData({ ...serviceData, type: 'service' })
        setShowCompleteDialog(true)
        return
      } catch (error: any) {
        // If not found as general service, try as oil change
        if (error.response?.status === 404) {
          const response = await api.get(`/oil-changes/${serviceId}`)
          const oilChangeData = response.data.data
          
          // Transform oil change data to match dialog format
          const items = []
          
          if (oilChangeData.oilProduct) {
            items.push({
              itemName: `Moy: ${oilChangeData.oilProduct.brand || ''} ${oilChangeData.oilProduct.viscosity || ''}`,
              quantity: oilChangeData.oilQuantityUsed || 0,
              unitPrice: oilChangeData.oilProduct.volume > 0 
                ? (oilChangeData.oilProduct.price || 0) / oilChangeData.oilProduct.volume 
                : 0
            })
          }
          
          if (oilChangeData.oilFilter) {
            items.push({
              itemName: `Moy filteri: ${oilChangeData.oilFilter.brand || ''} ${oilChangeData.oilFilter.partNumber || ''}`,
              quantity: 1,
              unitPrice: oilChangeData.oilFilter.price || 0
            })
          }
          
          if (oilChangeData.airFilter) {
            items.push({
              itemName: `Havo filteri: ${oilChangeData.airFilter.brand || ''} ${oilChangeData.airFilter.partNumber || ''}`,
              quantity: 1,
              unitPrice: oilChangeData.airFilter.price || 0
            })
          }
          
          if (oilChangeData.cabinFilter) {
            items.push({
              itemName: `Salon filteri: ${oilChangeData.cabinFilter.brand || ''} ${oilChangeData.cabinFilter.partNumber || ''}`,
              quantity: 1,
              unitPrice: oilChangeData.cabinFilter.price || 0
            })
          }
          
          if (oilChangeData.fuelFilter) {
            items.push({
              itemName: `Yoqilg'i filteri: ${oilChangeData.fuelFilter.brand || ''} ${oilChangeData.fuelFilter.partNumber || ''}`,
              quantity: 1,
              unitPrice: oilChangeData.fuelFilter.price || 0
            })
          }
          
          const transformedData = {
            type: 'oilChange',
            mileage: oilChangeData.mileage || 0,
            totalPrice: oilChangeData.price || 0,
            paymentStatus: oilChangeData.paymentStatus || 'unpaid',
            amountPaid: oilChangeData.amountPaid || 0,
            amountDue: oilChangeData.amountDue || 0,
            notes: '',
            services: [{
              serviceName: 'Moy almashtirish',
              laborCost: oilChangeData.laborCost || 0,
              items: items,
              employees: oilChangeData.employees || [],
              totalPrice: oilChangeData.price || 0
            }]
          }
          
          setCompletingServiceId(serviceId)
          setCompletingServiceData(transformedData)
          setShowCompleteDialog(true)
          return
        }
        throw error
      }
    } catch (error) {
      alert('Xizmatni yuklashda xatolik yuz berdi')
    }
  }

  const confirmCompleteService = async () => {
    try {
      const serviceType = completingServiceData?.type || 'service'
      const endpoint = serviceType === 'oilChange' 
        ? `/oil-changes/${completingServiceId}/complete`
        : `/services/${completingServiceId}/complete`
      
      await api.post(endpoint)
      alert('Xizmat muvaffaqiyatli tugallandi')
      setShowCompleteDialog(false)
      setCompletingServiceId('')
      setCompletingServiceData(null)
      fetchVehicleData() // Reload data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xizmatni tugatishda xatolik yuz berdi')
    }
  }

  const handlePrintA4 = async (serviceId: string, type: 'oilChange' | 'service') => {
    try {
      let serviceData
      
      if (type === 'oilChange') {
        const response = await api.get(`/oil-changes/${serviceId}`)
        serviceData = response.data.data
        console.log('Oil change data for print:', serviceData)
        console.log('Oil product:', serviceData.oilProduct)
        console.log('Oil product type:', typeof serviceData.oilProduct)
      } else {
        const response = await api.get(`/services/${serviceId}`)
        serviceData = response.data.data
        console.log('Service data for print:', serviceData)
      }
      
      // Generate QR code
      const publicUrl = `${window.location.origin}/public/service/${serviceData.publicUuid || serviceId}`
      try {
        const QRCodeModule = await import('qrcode') as any
        const qrDataUrl = await QRCodeModule.default.toDataURL(publicUrl, {
          width: 80,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeDataUrl(qrDataUrl)
      } catch (qrError) {
        console.error('QR Code generation failed:', qrError)
        setQrCodeDataUrl('')
      }
      
      setLastServiceData(serviceData)
      setPrintType('receipt')
      setShowPrintPreview(true) // Show modal to choose format
    } catch (error) {
      console.error('Print error:', error)
      alert('Xizmatni yuklashda xatolik yuz berdi')
    }
  }

  const handlePrint = async () => {
    try {
      const s = lastServiceData
      if (s && (s.publicUuid || s._id)) {
        const publicUrl = `${window.location.origin}/public/service/${s.publicUuid || s._id}`
        const QRCodeModule = (await import('qrcode')) as any
        const url = await QRCodeModule.default.toDataURL(publicUrl, {
          width: 160,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' }
        })
        setQrCodeDataUrl(url)
      }
    } catch {
      // ignore QR errors; receipt still prints
    }
    setTimeout(() => {
      window.print()
      setShowPrintPreview(false)
    }, 150)
  }

  // DUPLICATE REMOVED - handleViewServiceHistory is already defined earlier in the file
  // DUPLICATE REMOVED - handleViewGeneralServiceHistory is already defined earlier in the file

  const handleDeleteGeneralService = async (serviceId: string) => {
    if (!confirm('Ushbu xizmatni o\'chirmoqchimisiz? U arxivga ko\'chiriladi.')) return

    try {
      await api.post(`/services/${serviceId}/archive`, {
        reason: 'Deleted from vehicle detail page'
      })
      alert('Xizmat muvaffaqiyatli o\'chirildi')
      fetchVehicleData() // Reload data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xizmatni o\'chirishda xatolik yuz berdi')
    }
  }

  const handleEditGeneralService = async (serviceId: string, type: 'oilChange' | 'service') => {
    if (type === 'oilChange') {
      // Fetch oil change data from API and open edit dialog
      try {
        const response = await api.get(`/oil-changes/${serviceId}?t=${Date.now()}`)
        const service = response.data.data
        console.log('Fetched service from API for edit:', service)
        console.log('Service employeeCommissions from API:', service.employeeCommissions)
        
        handleEditService(service)
      } catch (error) {
        alert('Xizmatni yuklashda xatolik yuz berdi')
      }
    } else {
      // General service edit - open edit dialog
      setEditingGeneralServiceId(serviceId)
      setShowEditGeneralServiceDialog(true)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Ushbu xizmatni o\'chirmoqchimisiz? U arxivga ko\'chiriladi.')) return

    try {
      await api.post(`/oil-changes/${serviceId}/archive`, {
        reason: 'Deleted from vehicle detail page'
      })
      alert('Xizmat muvaffaqiyatli o\'chirildi')
      fetchVehicleData() // Reload data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xizmatni o\'chirishda xatolik yuz berdi')
    }
  }

  const handleEditService = (service: any) => {
    // Check if vehicle is deleted
    if (data?.vehicle?.plateNumber?.includes('_DELETED_')) {
      alert('Bu serviceni tahrirlash mumkin emas, chunki mashina o\'chirilgan va raqami qayta ishlatilgan.')
      return
    }
    
    setEditingService(service)
    setEditServiceOilProductId(service.oilProduct?._id || 'none')
    setEditServiceOilProductCustomerProvided(service.oilProductCustomerProvided || false)
    setEditServiceOilFilterId(service.oilFilter?._id || 'none')
    setEditServiceOilFilterCustomerProvided(service.oilFilterCustomerProvided || false)
    setEditServiceAirFilterId(service.airFilter?._id || 'none')
    setEditServiceAirFilterCustomerProvided(service.airFilterCustomerProvided || false)
    setEditServiceCabinFilterId(service.cabinFilter?._id || 'none')
    setEditServiceCabinFilterCustomerProvided(service.cabinFilterCustomerProvided || false)
    setEditServiceFuelFilterId(service.fuelFilter?._id || 'none')
    setEditServiceFuelFilterCustomerProvided(service.fuelFilterCustomerProvided || false)
    setEditServiceEmployeeIds(service.employees?.map((e: any) => e?._id || e) || [])
    
    // Initialize labor cost state
    setEditServiceLaborCost(service.laborCost || 0)
    
    // Load existing employee commissions
    setEmployeeCommissions(service.employeeCommissions || [])
    
    console.log('Loading service for edit:', service)
    console.log('Existing employee commissions:', service.employeeCommissions)
    
    setShowEditService(true)
  }

  const handleUpdateService = async () => {
    if (!editingService) return

    try {
      const mileage = (document.getElementById('edit-service-mileage') as HTMLInputElement)?.value
      const nextServiceMileage = (document.getElementById('edit-service-next-mileage') as HTMLInputElement)?.value
      const laborCost = (document.getElementById('edit-service-labor') as HTMLInputElement)?.value
      const oilQuantityUsed = (document.getElementById('edit-oil-quantity') as HTMLInputElement)?.value

      if (!mileage || !nextServiceMileage) {
        alert('Barcha majburiy maydonlarni to\'ldiring')
        return
      }

      const updateData: any = {
        mileage: Number(mileage),
        nextServiceMileage: Number(nextServiceMileage),
        laborCost: editServiceLaborCost,
        oilQuantityUsed: Number(oilQuantityUsed) || editingService.oilQuantityUsed
      }

      // Oil product - handle customer provided
      if (editServiceOilProductCustomerProvided !== editingService.oilProductCustomerProvided) {
        updateData.oilProductCustomerProvided = editServiceOilProductCustomerProvided
        if (editServiceOilProductCustomerProvided) {
          const oilProductDetails = (document.getElementById('edit-oil-product-details') as HTMLInputElement)?.value
          updateData.oilProductCustomerProvidedDetails = oilProductDetails
          updateData.oilProductId = null
        }
      }
      
      // Add oil product if changed and not customer provided
      if (!editServiceOilProductCustomerProvided && editServiceOilProductId !== (editingService.oilProduct?._id || 'none')) {
        updateData.oilProductId = editServiceOilProductId === 'none' ? null : editServiceOilProductId
      }

      // Oil Filter - handle customer provided
      if (editServiceOilFilterCustomerProvided !== editingService.oilFilterCustomerProvided) {
        updateData.oilFilterCustomerProvided = editServiceOilFilterCustomerProvided
        if (editServiceOilFilterCustomerProvided) {
          const oilFilterDetails = (document.getElementById('edit-oil-filter-details') as HTMLInputElement)?.value
          updateData.oilFilterCustomerProvidedDetails = oilFilterDetails
          updateData.oilFilterId = null
        }
      }
      
      if (!editServiceOilFilterCustomerProvided && editServiceOilFilterId !== (editingService.oilFilter?._id || 'none')) {
        updateData.oilFilterId = editServiceOilFilterId === 'none' ? null : editServiceOilFilterId
      }

      // Air Filter - handle customer provided
      if (editServiceAirFilterCustomerProvided !== editingService.airFilterCustomerProvided) {
        updateData.airFilterCustomerProvided = editServiceAirFilterCustomerProvided
        if (editServiceAirFilterCustomerProvided) {
          const airFilterDetails = (document.getElementById('edit-air-filter-details') as HTMLInputElement)?.value
          updateData.airFilterCustomerProvidedDetails = airFilterDetails
          updateData.airFilterId = null
        }
      }
      
      if (!editServiceAirFilterCustomerProvided && editServiceAirFilterId !== (editingService.airFilter?._id || 'none')) {
        updateData.airFilterId = editServiceAirFilterId === 'none' ? null : editServiceAirFilterId
      }

      // Cabin Filter - handle customer provided
      if (editServiceCabinFilterCustomerProvided !== editingService.cabinFilterCustomerProvided) {
        updateData.cabinFilterCustomerProvided = editServiceCabinFilterCustomerProvided
        if (editServiceCabinFilterCustomerProvided) {
          const cabinFilterDetails = (document.getElementById('edit-cabin-filter-details') as HTMLInputElement)?.value
          updateData.cabinFilterCustomerProvidedDetails = cabinFilterDetails
          updateData.cabinFilterId = null
        }
      }
      
      if (!editServiceCabinFilterCustomerProvided && editServiceCabinFilterId !== (editingService.cabinFilter?._id || 'none')) {
        updateData.cabinFilterId = editServiceCabinFilterId === 'none' ? null : editServiceCabinFilterId
      }

      // Fuel Filter - handle customer provided
      if (editServiceFuelFilterCustomerProvided !== editingService.fuelFilterCustomerProvided) {
        updateData.fuelFilterCustomerProvided = editServiceFuelFilterCustomerProvided
        if (editServiceFuelFilterCustomerProvided) {
          const fuelFilterDetails = (document.getElementById('edit-fuel-filter-details') as HTMLInputElement)?.value
          updateData.fuelFilterCustomerProvidedDetails = fuelFilterDetails
          updateData.fuelFilterId = null
        }
      }
      
      if (!editServiceFuelFilterCustomerProvided && editServiceFuelFilterId !== (editingService.fuelFilter?._id || 'none')) {
        updateData.fuelFilterId = editServiceFuelFilterId === 'none' ? null : editServiceFuelFilterId
      }

      // Add employees if changed
      const oldEmployeeIds = editingService.employees?.map((e: any) => e?._id || e).sort().join(',') || ''
      const newEmployeeIds = editServiceEmployeeIds.sort().join(',')
      if (oldEmployeeIds !== newEmployeeIds) {
        updateData.employeeIds = editServiceEmployeeIds
      }

      // Add employee commissions - always send current commissions
      updateData.employeeCommissions = employeeCommissions
      
      console.log('Updating service with data:', updateData)
      console.log('Employee commissions being sent:', employeeCommissions)

      const response = await api.put(`/oil-changes/${editingService._id}`, updateData)
      console.log('API response:', response.data)

      alert('Xizmat muvaffaqiyatli yangilandi')
      setShowEditService(false)
      setEditingService(null)
      setEditServiceLaborCost(0)
      setEmployeeCommissions([]) // Reset commissions after successful update
      fetchVehicleData() // Reload data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xizmatni yangilashda xatolik yuz berdi')
    }
  }

  const handleUpdateVehicle = async () => {
    try {
      const brand = (document.getElementById('edit-brand') as HTMLInputElement)?.value
      const vehicleModel = (document.getElementById('edit-model') as HTMLInputElement)?.value
      const engineType = editEngineType || data?.vehicle?.engineType

      if (!brand || !vehicleModel || !engineType) {
        alert('Barcha maydonlarni to\'ldiring')
        return
      }

      await api.put(`/vehicles/${params.id}`, {
        brand,
        vehicleModel,
        engineType
      })

      alert('Mashina muvaffaqiyatli yangilandi')
      setShowEditVehicle(false)
      fetchVehicleData() // Reload data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Mashinani yangilashda xatolik yuz berdi')
    }
  }

  const fetchFormData = async () => {
    try {
      const [inventoryRes, employeesRes, oilProductsRes, oilFiltersRes, airFiltersRes, cabinFiltersRes, fuelFiltersRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/employees'),
        api.get('/oil-products?activeOnly=true'),
        api.get('/filters?activeOnly=true&filterType=oil_filter'),
        api.get('/filters?activeOnly=true&filterType=air_filter'),
        api.get('/filters?activeOnly=true&filterType=cabin_filter'),
        api.get('/filters?activeOnly=true&filterType=fuel_filter')
      ])

      const inventory = inventoryRes.data.data
      setOilFilters(oilFiltersRes.data.data)
      setAirFilters(airFiltersRes.data.data)
      setCabinFilters(cabinFiltersRes.data.data)
      setFuelFilters(fuelFiltersRes.data.data)
      setAdditionalProducts(inventory.filter((i: any) => i.productType === 'other'))
      setEmployees(employeesRes.data.data.filter((e: any) => e.active))
      setOilProducts(oilProductsRes.data.data)
    } catch (error) {
      console.error('Failed to load form data:', error)
    }
  }

  const calculatePrice = () => {
    let total = 0

    // Oil product price - only if NOT customer provided
    if (!formData.oilProductCustomerProvided) {
      const oilProduct = oilProducts.find(p => p._id === formData.oilProductId)
      if (oilProduct && formData.oilQuantityUsed) {
        const quantityUsed = Number(formData.oilQuantityUsed)
        const pricePerLiter = oilProduct.price / oilProduct.volume
        total += pricePerLiter * quantityUsed
      }
    }

    // Oil Filter price - only if NOT customer provided
    if (!formData.oilFilterCustomerProvided && formData.oilFilterId) {
      const filter = oilFilters.find(f => f._id === formData.oilFilterId)
      if (filter) total += filter.price
    }

    // Air Filter price - only if NOT customer provided
    if (!formData.airFilterCustomerProvided && formData.airFilterId) {
      const filter = airFilters.find(f => f._id === formData.airFilterId)
      if (filter) total += filter.price
    }

    // Cabin Filter price - only if NOT customer provided
    if (!formData.cabinFilterCustomerProvided && formData.cabinFilterId) {
      const filter = cabinFilters.find(f => f._id === formData.cabinFilterId)
      if (filter) total += filter.price
    }

    // Fuel Filter price - only if NOT customer provided
    if (!formData.fuelFilterCustomerProvided && formData.fuelFilterId) {
      const filter = fuelFilters.find(f => f._id === formData.fuelFilterId)
      if (filter) total += filter.price
    }

    // Additional products
    formData.additionalProducts.forEach(productId => {
      const product = additionalProducts.find(p => p._id === productId)
      if (product) total += product.price
    })

    // Custom products (manually entered)
    formData.customProducts.forEach(product => {
      if (product.price) {
        total += Number(product.price)
      }
    })

    // Labor cost
    if (formData.laborCost) {
      total += Number(formData.laborCost)
    }

    return total
  }

  const handleAdditionalProductChange = (productId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        additionalProducts: [...formData.additionalProducts, productId],
      })
    } else {
      setFormData({
        ...formData,
        additionalProducts: formData.additionalProducts.filter(id => id !== productId),
      })
    }
  }

  // Format number with spaces every 3 digits
  const formatNumberWithSpaces = (value: string): string => {
    const numericValue = value.replace(/\s/g, '')
    if (!numericValue) return ''
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Remove spaces from formatted number
  const removeSpaces = (value: string): string => {
    return value.replace(/\s/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      (!formData.oilProductId && !formData.oilProductCustomerProvided) ||
      !formData.oilQuantityUsed ||
      !formData.mileage ||
      !formData.nextServiceMileage ||
      formData.employeeIds.length === 0
    ) {
      alert('Please fill all required fields and select at least one employee')
      return
    }

    try {
      setIsSaving(true)

      const oilChangeData: any = {
        vehicleId: params.id,
        customerId: data.vehicle.customer._id,
        employeeIds: formData.employeeIds,
        employeeCommissions: employeeCommissions,
        oilProductId: formData.oilProductCustomerProvided ? undefined : formData.oilProductId,
        oilProductCustomerProvided: formData.oilProductCustomerProvided,
        oilProductCustomerProvidedDetails: formData.oilProductCustomerProvided ? formData.oilProductCustomerProvidedDetails : undefined,
        oilQuantityUsed: Number(formData.oilQuantityUsed),
        additionalProducts: formData.additionalProducts.map(productId => ({
          productId,
          quantity: 1
        })),
        mileage: Number(formData.mileage),
        nextServiceMileage: Number(formData.nextServiceMileage),
        laborCost: Number(formData.laborCost) || 0,
        price: calculateTotalPrice(),
        // Payment fields
        paymentStatus: formData.paymentStatus,
        amountPaid: formData.paymentStatus === 'paid' ? calculateTotalPrice() : 
                    formData.paymentStatus === 'partial' ? Number(formData.amountPaid) : 0,
        dueDate: formData.dueDate
      }

      // Oil Filter (optional)
      if (formData.oilFilterId || formData.oilFilterCustomerProvided) {
        oilChangeData.oilFilterId = formData.oilFilterCustomerProvided ? undefined : formData.oilFilterId
        oilChangeData.oilFilterCustomerProvided = formData.oilFilterCustomerProvided
        oilChangeData.oilFilterCustomerProvidedDetails = formData.oilFilterCustomerProvided ? formData.oilFilterCustomerProvidedDetails : undefined
      }

      // Air Filter (optional)
      if (formData.airFilterId || formData.airFilterCustomerProvided) {
        oilChangeData.airFilterId = formData.airFilterCustomerProvided ? undefined : formData.airFilterId
        oilChangeData.airFilterCustomerProvided = formData.airFilterCustomerProvided
        oilChangeData.airFilterCustomerProvidedDetails = formData.airFilterCustomerProvided ? formData.airFilterCustomerProvidedDetails : undefined
      }

      // Cabin Filter (optional)
      if (formData.cabinFilterId || formData.cabinFilterCustomerProvided) {
        oilChangeData.cabinFilterId = formData.cabinFilterCustomerProvided ? undefined : formData.cabinFilterId
        oilChangeData.cabinFilterCustomerProvided = formData.cabinFilterCustomerProvided
        oilChangeData.cabinFilterCustomerProvidedDetails = formData.cabinFilterCustomerProvided ? formData.cabinFilterCustomerProvidedDetails : undefined
      }

      // Fuel Filter (optional)
      if (formData.fuelFilterId || formData.fuelFilterCustomerProvided) {
        oilChangeData.fuelFilterId = formData.fuelFilterCustomerProvided ? undefined : formData.fuelFilterId
        oilChangeData.fuelFilterCustomerProvided = formData.fuelFilterCustomerProvided
        oilChangeData.fuelFilterCustomerProvidedDetails = formData.fuelFilterCustomerProvided ? formData.fuelFilterCustomerProvidedDetails : undefined
      }

      const createRes = await api.post('/oil-changes', oilChangeData)
      const created = createRes.data?.data

      // To'liq ma'lumot (chek / A4 chop etish uchun)
      setLastServiceData(created || oilChangeData)
      setPrintType('receipt')

      // Reset form
      setFormData({
        oilProductId: '',
        oilProductCustomerProvided: false,
        oilProductCustomerProvidedDetails: '',
        oilQuantityUsed: '',
        oilFilterId: '',
        oilFilterCustomerProvided: false,
        oilFilterCustomerProvidedDetails: '',
        airFilterId: '',
        airFilterCustomerProvided: false,
        airFilterCustomerProvidedDetails: '',
        cabinFilterId: '',
        cabinFilterCustomerProvided: false,
        cabinFilterCustomerProvidedDetails: '',
        fuelFilterId: '',
        fuelFilterCustomerProvided: false,
        fuelFilterCustomerProvidedDetails: '',
        additionalProducts: [],
        customProducts: [],
        employeeIds: [],
        mileage: '',
        nextServiceMileage: '',
        laborCost: '',
        notes: '',
        paymentStatus: 'unpaid',
        amountPaid: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      setEmployeeCommissions([])
      setShowMoreFilters(false)
      setShowAdditionalProducts(false)
      setShowOilChangeDialog(false)
      setShowPrintPreview(true)
      fetchVehicleData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to record oil change')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrintService = async (service: any) => {
    try {
      console.log('Printing service:', service._id)
      
      // Load full service data for printing with cache busting
      const response = await api.get(`/services/${service._id}?t=${Date.now()}`)
      console.log('Service data loaded:', response.data)
      
      const serviceData = response.data.data
      
      setLastServiceData({
        ...serviceData,
        createdAt: serviceData.createdAt,
        price: serviceData.totalPrice || serviceData.price,
        mileage: serviceData.mileage,
        nextServiceMileage: serviceData.nextServiceMileage,
        oilProduct: serviceData.oilProduct,
        oilFilter: serviceData.oilFilter,
        airFilter: serviceData.airFilter,
        cabinFilter: serviceData.cabinFilter,
        fuelFilter: serviceData.fuelFilter,
        employees: serviceData.employees,
        oilQuantityUsed: serviceData.oilQuantityUsed
      })
      
      setPrintType('receipt')
      setShowPrintPreview(true)
      
    } catch (error: any) {
      console.error('Print service error:', error)
      console.error('Error response:', error.response?.data)
      
      if (error.response?.status === 304) {
        // Handle 304 Not Modified - try to use cached data
        console.log('Using service data from props:', service)
        setLastServiceData({
          ...service,
          createdAt: service.createdAt,
          price: service.totalPrice || service.price,
          mileage: service.mileage,
          nextServiceMileage: service.nextServiceMileage,
          employees: service.employees || []
        })
        setPrintType('receipt')
        setShowPrintPreview(true)
      } else {
        alert(`Xizmatni yuklashda xatolik yuz berdi: ${error.response?.data?.message || error.message}`)
      }
    }
  }

  // DUPLICATE REMOVED - handlePrint is already defined earlier in the file

  const openKioskWindow = useCallback(
    (screen: 'new' | 'service') => {
      const vid = params.id as string
      if (!vid) return
      const url = `${window.location.origin}/kiosk?vehicleId=${encodeURIComponent(vid)}&screen=${screen}`
      window.open(url, 'oilerKiosk', 'noopener,noreferrer,width=1440,height=900')
    },
    [params.id]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const { vehicle } = data
  const totalServices = 0 // Placeholder - can be calculated from unified history if needed
  const lastService = null // Placeholder - can be calculated from unified history if needed
  const oilChanges = [] // No longer used, UnifiedServiceHistory handles this

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/service')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{vehicle.plateNumber}</h1>
            <p className="text-muted-foreground mt-1">{vehicle.brand} {vehicle.vehicleModel}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canSection('ui.vehicle.header_actions') && (
          <>
          <Button className="gap-2" onClick={() => setShowOilChangeDialog(true)}>
            <Plus className="w-4 h-4" />
            Yangi moy almashtirish
          </Button>
          <Button className="gap-2" variant="outline" onClick={() => setShowServiceDialog(true)}>
            <Plus className="w-4 h-4" />
            Xizmat qo'shish
          </Button>
          </>
          )}
          {fromRegister && (
            <Button type="button" variant="secondary" className="gap-2" onClick={() => openKioskWindow('new')}>
              <Monitor className="h-4 w-4" />
              Kiosk: yangi mijoz
            </Button>
          )}
          <Button type="button" variant="outline" className="gap-2 border-primary/50" onClick={() => openKioskWindow('service')}>
            <Monitor className="h-4 w-4" />
            Kiosk: mijoz ko‘rinishi
          </Button>
        </div>
      </div>
     
      {canSection('ui.vehicle.summary_cards') && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Jami xizmatlar</p>
            <p className="text-2xl font-bold text-foreground mt-2">{totalServices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Oxirgi xizmat</p>
            <p className="text-lg font-semibold text-foreground mt-2">
              {lastService ? new Date((lastService as any).createdAt).toLocaleDateString() : 'Hech qachon'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Dvigatel turi</p>
            <Badge variant="outline" className="mt-2 capitalize">{vehicle.engineType === 'petrol' ? 'benzin' : vehicle.engineType === 'diesel' ? 'dizel' : vehicle.engineType}</Badge>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Customer Debt Card */}
      {canSection('ui.vehicle.payments') && debtSummary && (
        <CustomerDebtCard
          totalDebt={debtSummary.totalDebt || 0}
          unpaidServices={debtSummary.unpaidServices || 0}
          overdueServices={debtSummary.overdueServices || 0}
          lastPaymentDate={vehicle.customer?.lastPaymentDate}
          onViewHistory={() => {
            // Scroll to payment history table
            const historyElement = document.getElementById('payment-history-section')
            if (historyElement) {
              historyElement.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          onRecordPayment={() => {
            setShowPaymentDialog(true)
          }}
        />
      )}

      {/* Payment History Table - Collapsible */}
      {canSection('ui.vehicle.payments') && debtSummary && (
        <Card id="payment-history-section">
          <CardHeader 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>To'lov tarixi</CardTitle>
                <CardDescription>Barcha xizmatlar va to'lovlar tarixi</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                {showPaymentHistory ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                )}
              </Button>
            </div>
          </CardHeader>
          {showPaymentHistory && (
            <CardContent>
              {loadingPaymentHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <PaymentHistoryTable
                  transactions={paymentHistory}
                  currentPage={paymentHistoryPage}
                  totalPages={paymentHistoryTotalPages}
                  totalRecords={paymentHistoryTotal}
                  onPageChange={(page) => {
                    if (data?.vehicle?.customer?._id) {
                      fetchPaymentHistory(data.vehicle.customer._id, page)
                    }
                  }}
                />
              )}
            </CardContent>
          )}
        </Card>
      )}

      {canSection('ui.vehicle.info_card') && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mashina ma'lumotlari</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleViewHistory}>
              <History className="w-4 h-4 mr-2" />
              Ta'rix
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEditVehicle(true)}>
              Tahrirlash
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteVehicle()}>
              O'chirish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Davlat raqami</dt>
              <dd className="text-lg font-bold text-primary mt-1">{vehicle.plateNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Mashina</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{vehicle.brand} {vehicle.vehicleModel}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Mijoz</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{vehicle.customer?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Telefon</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{vehicle.customer?.phone || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      )}

      {/* Edit Vehicle Modal */}
      <Dialog open={showEditVehicle} onOpenChange={setShowEditVehicle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mashinani tahrirlash</DialogTitle>
            <DialogDescription>Mashina ma'lumotlarini yangilash</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Davlat raqami</Label>
              <Input value={vehicle.plateNumber} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Davlat raqamini o'zgartirib bo'lmaydi</p>
            </div>
            <div>
              <Label>Brend</Label>
              <Input 
                id="edit-brand"
                defaultValue={vehicle.brand}
              />
            </div>
            <div>
              <Label>Model</Label>
              <Input 
                id="edit-model"
                defaultValue={vehicle.vehicleModel}
              />
            </div>
            <div>
              <Label>Dvigatel turi</Label>
              <Select 
                defaultValue={vehicle.engineType}
                onValueChange={(value) => setEditEngineType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Benzin</SelectItem>
                  <SelectItem value="diesel">Dizel</SelectItem>
                  <SelectItem value="hybrid">Gibrid</SelectItem>
                  <SelectItem value="electric">Elektr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateVehicle} className="flex-1">
                O'zgarishlarni saqlash
              </Button>
              <Button variant="outline" onClick={() => setShowEditVehicle(false)}>
                Bekor qilish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ta'rix (History)</DialogTitle>
            <DialogDescription>
              Barcha o'zgarishlar tarixi
            </DialogDescription>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : historyData.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Ta'rix topilmadi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyData.map((entry, index) => (
                <div key={entry._id || index} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          className={
                            entry.action === 'created' 
                              ? 'bg-green-100 text-green-900 border-green-200'
                              : entry.action === 'updated'
                              ? 'bg-blue-100 text-blue-900 border-blue-200'
                              : 'bg-orange-100 text-orange-900 border-orange-200'
                          }
                        >
                          {entry.action === 'created' ? 'Yaratildi' : entry.action === 'updated' ? 'O\'zgartirildi' : 'Arxivlandi'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.performedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{entry.performedBy?.name || 'Unknown'}</span>
                        <span className="text-xs">({entry.performedBy?.email || 'N/A'})</span>
                      </div>
                    </div>
                  </div>

                  {entry.reason && (
                    <div className="mb-3 p-2 bg-muted/30 rounded">
                      <p className="text-sm font-semibold text-foreground mb-1">Sabab:</p>
                      <p className="text-sm text-muted-foreground italic">{entry.reason}</p>
                    </div>
                  )}

                  {entry.changes && entry.changes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">O'zgarishlar:</p>
                      {entry.changes.map((change: any, idx: number) => (
                        <div key={idx} className="bg-muted/30 border border-border rounded p-3">
                          <p className="text-sm font-semibold text-foreground mb-2 capitalize">
                            {change.field}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Eski qiymat:</p>
                              <div className="bg-red-50 border border-red-200 rounded p-2">
                                <p className="text-xs text-foreground font-mono break-all">
                                  {change.oldValue === null || change.oldValue === undefined 
                                    ? '(bo\'sh)' 
                                    : typeof change.oldValue === 'object'
                                    ? JSON.stringify(change.oldValue, null, 2)
                                    : String(change.oldValue)}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Yangi qiymat:</p>
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <p className="text-xs text-foreground font-mono break-all">
                                  {change.newValue === null || change.newValue === undefined 
                                    ? '(bo\'sh)' 
                                    : typeof change.newValue === 'object'
                                    ? JSON.stringify(change.newValue, null, 2)
                                    : String(change.newValue)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.action === 'created' && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-foreground mb-2">Yaratilgan ma'lumot:</p>
                      <div className="bg-muted/30 border border-border rounded p-3 max-h-60 overflow-y-auto">
                        <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                          {JSON.stringify(entry.snapshot, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditService} onOpenChange={setShowEditService}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xizmatni tahrirlash</DialogTitle>
            <DialogDescription>
              Xizmat ma'lumotlarini yangilash - Mashina: {vehicle.plateNumber}
            </DialogDescription>
          </DialogHeader>
          {editingService && (
            <div className="space-y-6">
              {/* Oil Product */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-3">Moy mahsuloti</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-oilProductCustomerProvided"
                      checked={editServiceOilProductCustomerProvided}
                      onCheckedChange={(checked) => {
                        setEditServiceOilProductCustomerProvided(checked as boolean)
                        if (checked) {
                          setEditServiceOilProductId('none')
                        }
                      }}
                    />
                    <Label htmlFor="edit-oilProductCustomerProvided" className="cursor-pointer">
                      Mijoz o'z moyini olib keldi
                    </Label>
                  </div>

                  {editServiceOilProductCustomerProvided ? (
                    <div>
                      <Label>Moy ma'lumotlari</Label>
                      <Input
                        id="edit-oil-product-details"
                        placeholder="Masalan: Mobil 5W-30 SN 4L"
                        defaultValue={editingService.oilProductCustomerProvidedDetails || ''}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label>Moy mahsulotini tanlang</Label>
                      <Select 
                        value={editServiceOilProductId}
                        onValueChange={setEditServiceOilProductId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Moy mahsulotini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo'q</SelectItem>
                          {oilProducts.map((product) => (
                            <SelectItem key={product._id} value={product._id}>
                              {product.displayName} (Ombor: {product.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Ishlatilgan miqdor (L)</Label>
                    <Input
                      id="edit-oil-quantity"
                      type="number"
                      step="0.1"
                      defaultValue={editingService.oilQuantityUsed}
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-3">Filterlar</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  <span className="font-semibold text-foreground">Mashina:</span>{' '}
                  <span className="font-mono">{vehicle.plateNumber}</span>
                  {' · '}
                  {vehicle.brand} {vehicle.vehicleModel}
                </p>
                <div className="space-y-4">
                  {/* Oil Filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id="edit-oilFilterCustomerProvided"
                        checked={editServiceOilFilterCustomerProvided}
                        onCheckedChange={(checked) => {
                          setEditServiceOilFilterCustomerProvided(checked as boolean)
                          if (checked) {
                            setEditServiceOilFilterId('none')
                          }
                        }}
                      />
                      <Label htmlFor="edit-oilFilterCustomerProvided" className="cursor-pointer text-xs">
                        Mijoz moy filterini olib keldi
                      </Label>
                    </div>
                    {editServiceOilFilterCustomerProvided ? (
                      <Input
                        id="edit-oil-filter-details"
                        placeholder="Moy filteri ma'lumotlari"
                        defaultValue={editingService.oilFilterCustomerProvidedDetails || ''}
                        className="text-sm"
                      />
                    ) : (
                      <Select 
                        value={editServiceOilFilterId}
                        onValueChange={setEditServiceOilFilterId}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Moy filterini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo'q</SelectItem>
                          {oilFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filterSelectItemLabel(filter, 'stockOnly')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Air Filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id="edit-airFilterCustomerProvided"
                        checked={editServiceAirFilterCustomerProvided}
                        onCheckedChange={(checked) => {
                          setEditServiceAirFilterCustomerProvided(checked as boolean)
                          if (checked) {
                            setEditServiceAirFilterId('none')
                          }
                        }}
                      />
                      <Label htmlFor="edit-airFilterCustomerProvided" className="cursor-pointer text-xs">
                        Mijoz havo filterini olib keldi
                      </Label>
                    </div>
                    {editServiceAirFilterCustomerProvided ? (
                      <Input
                        id="edit-air-filter-details"
                        placeholder="Havo filteri ma'lumotlari"
                        defaultValue={editingService.airFilterCustomerProvidedDetails || ''}
                        className="text-sm"
                      />
                    ) : (
                      <Select 
                        value={editServiceAirFilterId}
                        onValueChange={setEditServiceAirFilterId}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Havo filterini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo'q</SelectItem>
                          {airFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filterSelectItemLabel(filter, 'stockOnly')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Cabin Filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id="edit-cabinFilterCustomerProvided"
                        checked={editServiceCabinFilterCustomerProvided}
                        onCheckedChange={(checked) => {
                          setEditServiceCabinFilterCustomerProvided(checked as boolean)
                          if (checked) {
                            setEditServiceCabinFilterId('none')
                          }
                        }}
                      />
                      <Label htmlFor="edit-cabinFilterCustomerProvided" className="cursor-pointer text-xs">
                        Mijoz salon filterini olib keldi
                      </Label>
                    </div>
                    {editServiceCabinFilterCustomerProvided ? (
                      <Input
                        id="edit-cabin-filter-details"
                        placeholder="Salon filteri ma'lumotlari"
                        defaultValue={editingService.cabinFilterCustomerProvidedDetails || ''}
                        className="text-sm"
                      />
                    ) : (
                      <Select 
                        value={editServiceCabinFilterId}
                        onValueChange={setEditServiceCabinFilterId}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Salon filterini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo'q</SelectItem>
                          {cabinFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filterSelectItemLabel(filter, 'stockOnly')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Fuel Filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id="edit-fuelFilterCustomerProvided"
                        checked={editServiceFuelFilterCustomerProvided}
                        onCheckedChange={(checked) => {
                          setEditServiceFuelFilterCustomerProvided(checked as boolean)
                          if (checked) {
                            setEditServiceFuelFilterId('none')
                          }
                        }}
                      />
                      <Label htmlFor="edit-fuelFilterCustomerProvided" className="cursor-pointer text-xs">
                        Mijoz yoqilg'i filterini olib keldi
                      </Label>
                    </div>
                    {editServiceFuelFilterCustomerProvided ? (
                      <Input
                        id="edit-fuel-filter-details"
                        placeholder="Yoqilg'i filteri ma'lumotlari"
                        defaultValue={editingService.fuelFilterCustomerProvidedDetails || ''}
                        className="text-sm"
                      />
                    ) : (
                      <Select 
                        value={editServiceFuelFilterId}
                        onValueChange={setEditServiceFuelFilterId}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Yoqilg'i filterini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo'q</SelectItem>
                          {fuelFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filterSelectItemLabel(filter, 'stockOnly')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* Employees */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-3">Xodimlar</h3>
                <div className="space-y-2">
                  {employees.map((emp) => (
                    <div key={emp._id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`emp-${emp._id}`}
                        checked={editServiceEmployeeIds.includes(emp._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditServiceEmployeeIds([...editServiceEmployeeIds, emp._id])
                          } else {
                            setEditServiceEmployeeIds(editServiceEmployeeIds.filter(id => id !== emp._id))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`emp-${emp._id}`} className="text-sm cursor-pointer">
                        {emp.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Eslatma: Xodimlarni o'zgartirish komissiyani ish haqi asosida qayta hisoblaydi.
                </p>

                {/* Employee Commission Control */}
                {editServiceEmployeeIds.length > 0 && (
                  <div className="mt-4">
                    <EmployeeCommissionControl
                      employees={employees}
                      selectedEmployees={editServiceEmployeeIds}
                      laborCost={editServiceLaborCost}
                      commissions={employeeCommissions}
                      onCommissionsChange={(commissions) => {
                        console.log('Commission changed in parent:', commissions)
                        setEmployeeCommissions(commissions)
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Mileage & Service Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-3">Probeg va Xizmat ma'lumotlari</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-service-mileage">Hozirgi probeg (km) *</Label>
                    <Input
                      id="edit-service-mileage"
                      type="number"
                      defaultValue={editingService.mileage}
                      placeholder="Masalan: 50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-service-next-mileage">Keyingi xizmat probegi (km) *</Label>
                    <Input
                      id="edit-service-next-mileage"
                      type="number"
                      defaultValue={editingService.nextServiceMileage}
                      placeholder="Masalan: 55000"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-3">Narxlash</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-service-labor">Ish haqi (so'm)</Label>
                    <Input
                      id="edit-service-labor"
                      type="number"
                      value={editServiceLaborCost}
                      placeholder="Masalan: 50000"
                      onChange={(e) => {
                        const newLaborCost = Number(e.target.value) || 0
                        setEditServiceLaborCost(newLaborCost)
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Xodim komissiyasini hisoblash uchun ishlatiladi
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Jami narx:</span>
                      <span className="text-2xl font-bold text-primary">
                        {(editingService.price || 0).toLocaleString()} so'm
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Mahsulotlar va ish haqi asosida avtomatik hisoblanadi
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Products */}
              {editingService.additionalProducts && editingService.additionalProducts.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-foreground mb-3">Qo'shimcha mahsulotlar</h3>
                  <div className="space-y-2">
                    {editingService.additionalProducts.map((prod: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                        <span>{prod.product?.name || 'Noma\'lum'}</span>
                        <span>Miqdor: {prod.quantity} × {prod.price} so'm</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Eslatma: Qo'shimcha mahsulotlarni xizmat yaratilgandan keyin o'zgartirib bo'lmaydi.
                  </p>
                </div>
              )}

              {/* Service Date */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Xizmat sanasi</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(editingService.createdAt).toLocaleString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateService} className="flex-1">
                  O'zgarishlarni saqlash
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowEditService(false)
                  setEditingService(null)
                  setEditServiceLaborCost(0)
                  setEmployeeCommissions([]) // Reset commissions when closing
                }}>
                  Bekor qilish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {canSection('ui.vehicle.oil_work') && (
      <>
      {/* Add Service Dialog - moved before UnifiedServiceHistory */}
      <AddServiceDialog
        open={showServiceDialog}
        onClose={() => setShowServiceDialog(false)}
        vehicleId={params.id as string}
        customerId={data?.vehicle?.customer?._id}
        onSuccess={() => {
          fetchVehicleData()
        }}
      />

      {/* OLD SERVICE HISTORY - COMMENTED OUT, NOW USING UnifiedServiceHistory
      <Card>
        <CardHeader>
          <CardTitle>Service History ({oilChanges.length})</CardTitle>
          <CardDescription>Complete oil change records</CardDescription>
        </CardHeader>
        <CardContent>
          {oilChanges.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No service history yet</p>
          ) : (
            <div className="space-y-4">
              {oilChanges.map((service: any) => (
                <div key={service._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-foreground">
                          {service.oilProduct?.brand} {service.oilProduct?.viscosity} {service.oilProduct?.apiGrade}
                        </p>
                        <Badge variant="outline">{service.oilProduct?.volume}L</Badge>
                        {service.paymentStatus === 'paid' ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white border-green-600">
                            To'langan
                          </Badge>
                        ) : service.paymentStatus === 'partial' ? (
                          <Badge variant="secondary">
                            Qisman
                          </Badge>
                        ) : service.paymentStatus === 'unpaid' ? (
                          <Badge variant="destructive">
                            To'lanmagan
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mileage: {service.mileage} km • Next: {service.nextServiceMileage || (service.mileage + 5000)} km
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Employee: {service.employee?.name || 'N/A'}
                        {service.laborCost && service.laborCost > 0 && ` • Labor: $${service.laborCost}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(service.createdAt).toLocaleDateString()} {new Date(service.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-lg font-bold text-foreground text-right">{(service.price || 0).toLocaleString()} so'm</p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewServiceHistory(service._id)}
                          title="Ta'rix"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditService(service)}
                          title="Edit"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintService(service)}
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteService(service._id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      END OF OLD SERVICE HISTORY */}

      {/* Oil Change Dialog */}
      <Dialog open={showOilChangeDialog} onOpenChange={setShowOilChangeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi moy almashtirish xizmati</DialogTitle>
            <DialogDescription>
              Mashina: {vehicle.plateNumber} - {vehicle.brand} {vehicle.vehicleModel}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Info */}
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-semibold text-foreground mb-3">Mashina ma'lumotlari</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Brend/Model</p>
                  <p className="font-medium text-foreground">{vehicle.brand} {vehicle.vehicleModel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dvigatel</p>
                  <p className="font-medium text-foreground capitalize">{vehicle.engineType === 'petrol' ? 'Benzin' : vehicle.engineType === 'diesel' ? 'Dizel' : vehicle.engineType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mijoz</p>
                  <p className="font-medium text-foreground">{vehicle.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium text-foreground">{vehicle.customer?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Oil Selection Section */}
            <div className="border-b pb-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="oilProductCustomerProvided"
                  checked={formData.oilProductCustomerProvided}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    oilProductCustomerProvided: checked as boolean,
                    oilProductId: checked ? '' : formData.oilProductId
                  })}
                />
                <Label htmlFor="oilProductCustomerProvided" className="cursor-pointer">
                  Mijoz o'z moyini olib keldi
                </Label>
              </div>

              {formData.oilProductCustomerProvided ? (
                <div>
                  <Label htmlFor="oilProductCustomerProvidedDetails">Moy ma'lumotlari *</Label>
                  <Input
                    id="oilProductCustomerProvidedDetails"
                    placeholder="Masalan: Mobil 5W-30 SN 4L"
                    value={formData.oilProductCustomerProvidedDetails}
                    onChange={(e) => setFormData({ ...formData, oilProductCustomerProvidedDetails: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Moy brendi, qovushqoqligi va hajmini kiriting
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Moy mahsuloti *</h3>
                  <Select
                    value={formData.oilProductId}
                    onValueChange={(value) => {
                      const selectedProduct = oilProducts.find(p => p._id === value)
                      setFormData({
                        ...formData,
                        oilProductId: value,
                        oilQuantityUsed: selectedProduct ? String(selectedProduct.volume) : ''
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Moy mahsulotini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {oilProducts.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">Moy mahsulotlari mavjud emas</div>
                      ) : (
                        oilProducts.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.displayName} - {(product.price || 0).toLocaleString()} so'm ({product.stock || 0} omborda)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.oilProductId || formData.oilProductCustomerProvided) && (
                <div>
                  <Label htmlFor="oilQuantityUsed">Ishlatilgan moy miqdori (Litr) *</Label>
                  <Input
                    id="oilQuantityUsed"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="3.5"
                    value={formData.oilQuantityUsed}
                    onChange={(e) => setFormData({ ...formData, oilQuantityUsed: e.target.value })}
                    required
                  />
                  {(() => {
                    const selectedProduct = oilProducts.find(p => p._id === formData.oilProductId)
                    if (selectedProduct && formData.oilQuantityUsed) {
                      const quantityUsed = Number(formData.oilQuantityUsed)
                      const pricePerLiter = selectedProduct.price / selectedProduct.volume
                      const calculatedPrice = pricePerLiter * quantityUsed
                      return (
                        <p className="text-xs text-muted-foreground mt-1">
                          Idish: {selectedProduct.volume}L • Narx/L: {pricePerLiter.toFixed(2)} so'm •
                          Jami moy narxi: {calculatedPrice.toFixed(2)} so'm
                        </p>
                      )
                    }
                    return null
                  })()}
                </div>
              )}
            </div>

            {/* Filters Selection */}
            <div className="border-b pb-6 space-y-6">
              <h3 className="font-semibold text-foreground text-lg">Filterlar (Ixtiyoriy)</h3>
              <p className="text-sm text-muted-foreground -mt-2 mb-1">
                <span className="font-semibold text-foreground">Mashina:</span>{' '}
                <span className="font-mono">{vehicle.plateNumber}</span>
                {' · '}
                {vehicle.brand} {vehicle.vehicleModel}
              </p>

              {/* Oil Filter */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="oilFilterCustomerProvided"
                    checked={formData.oilFilterCustomerProvided}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      oilFilterCustomerProvided: checked as boolean,
                      oilFilterId: checked ? '' : formData.oilFilterId
                    })}
                  />
                  <Label htmlFor="oilFilterCustomerProvided" className="cursor-pointer">
                    Mijoz o'z moy filterini olib keldi
                  </Label>
                </div>

                {formData.oilFilterCustomerProvided ? (
                  <div>
                    <Label htmlFor="oilFilterCustomerProvidedDetails">Moy filteri ma'lumotlari</Label>
                    <Input
                      id="oilFilterCustomerProvidedDetails"
                      placeholder="Masalan: Mann W 712/75"
                      value={formData.oilFilterCustomerProvidedDetails}
                      onChange={(e) => setFormData({ ...formData, oilFilterCustomerProvidedDetails: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Moy filteri</Label>
                    <Select value={formData.oilFilterId} onValueChange={(value) => setFormData({ ...formData, oilFilterId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Moy filterini tanlang (ixtiyoriy)" />
                      </SelectTrigger>
                      <SelectContent>
                        {oilFilters.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">Moy filterlari mavjud emas</div>
                        ) : (
                          oilFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filterSelectItemLabel(filter, 'withPrice')}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Air Filter */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="airFilterCustomerProvided"
                    checked={formData.airFilterCustomerProvided}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      airFilterCustomerProvided: checked as boolean,
                      airFilterId: checked ? '' : formData.airFilterId
                    })}
                  />
                  <Label htmlFor="airFilterCustomerProvided" className="cursor-pointer">
                    Mijoz o'z havo filterini olib keldi
                  </Label>
                </div>

                {formData.airFilterCustomerProvided ? (
                  <div>
                    <Label htmlFor="airFilterCustomerProvidedDetails">Havo filteri ma'lumotlari</Label>
                    <Input
                      id="airFilterCustomerProvidedDetails"
                      placeholder="Masalan: Mann C 27 011"
                      value={formData.airFilterCustomerProvidedDetails}
                      onChange={(e) => setFormData({ ...formData, airFilterCustomerProvidedDetails: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Havo filteri</Label>
                    <Select value={formData.airFilterId} onValueChange={(value) => setFormData({ ...formData, airFilterId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Havo filterini tanlang (ixtiyoriy)" />
                      </SelectTrigger>
                      <SelectContent>
                        {airFilters.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">Havo filterlari mavjud emas</div>
                        ) : (
                          airFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filterSelectItemLabel(filter, 'withPrice')}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Show More Filters Button */}
              {!showMoreFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMoreFilters(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ko'proq filterlar qo'shish (Salon va Yoqilg'i)
                </Button>
              )}

              {/* Additional Filters (Cabin & Fuel) */}
              {showMoreFilters && (
                <>
                  {/* Cabin Filter */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="cabinFilterCustomerProvided"
                        checked={formData.cabinFilterCustomerProvided}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          cabinFilterCustomerProvided: checked as boolean,
                          cabinFilterId: checked ? '' : formData.cabinFilterId
                        })}
                      />
                      <Label htmlFor="cabinFilterCustomerProvided" className="cursor-pointer">
                        Mijoz o'z salon filterini olib keldi
                      </Label>
                    </div>

                    {formData.cabinFilterCustomerProvided ? (
                      <div>
                        <Label htmlFor="cabinFilterCustomerProvidedDetails">Salon filteri ma'lumotlari</Label>
                        <Input
                          id="cabinFilterCustomerProvidedDetails"
                          placeholder="Masalan: Mann CU 2882"
                          value={formData.cabinFilterCustomerProvidedDetails}
                          onChange={(e) => setFormData({ ...formData, cabinFilterCustomerProvidedDetails: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Salon filteri</Label>
                        <Select value={formData.cabinFilterId} onValueChange={(value) => setFormData({ ...formData, cabinFilterId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Salon filterini tanlang (ixtiyoriy)" />
                          </SelectTrigger>
                          <SelectContent>
                            {cabinFilters.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">Salon filterlari mavjud emas</div>
                            ) : (
                              cabinFilters.map((filter) => (
                                <SelectItem key={filter._id} value={filter._id}>
                                  {filterSelectItemLabel(filter, 'withPrice')}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Fuel Filter */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="fuelFilterCustomerProvided"
                        checked={formData.fuelFilterCustomerProvided}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          fuelFilterCustomerProvided: checked as boolean,
                          fuelFilterId: checked ? '' : formData.fuelFilterId
                        })}
                      />
                      <Label htmlFor="fuelFilterCustomerProvided" className="cursor-pointer">
                        Mijoz o'z yoqilg'i filterini olib keldi
                      </Label>
                    </div>

                    {formData.fuelFilterCustomerProvided ? (
                      <div>
                        <Label htmlFor="fuelFilterCustomerProvidedDetails">Yoqilg'i filteri ma'lumotlari</Label>
                        <Input
                          id="fuelFilterCustomerProvidedDetails"
                          placeholder="Masalan: Mann WK 853/3"
                          value={formData.fuelFilterCustomerProvidedDetails}
                          onChange={(e) => setFormData({ ...formData, fuelFilterCustomerProvidedDetails: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Yoqilg'i filteri</Label>
                        <Select value={formData.fuelFilterId} onValueChange={(value) => setFormData({ ...formData, fuelFilterId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Yoqilg'i filterini tanlang (ixtiyoriy)" />
                          </SelectTrigger>
                          <SelectContent>
                            {fuelFilters.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">Yoqilg'i filterlari mavjud emas</div>
                            ) : (
                              fuelFilters.map((filter) => (
                                <SelectItem key={filter._id} value={filter._id}>
                                  {filterSelectItemLabel(filter, 'withPrice')}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Additional Products */}
            <div className="border-b pb-6 space-y-4">
              <h3 className="font-semibold text-foreground">Boshqa mahsulotlar (Ixtiyoriy)</h3>

              {/* Show Additional Products Button */}
              {!showAdditionalProducts && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdditionalProducts(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Boshqa mahsulotlar qo'shish
                </Button>
              )}

              {/* Custom Products Input */}
              {showAdditionalProducts && (
                <div className="space-y-3">
                  {formData.customProducts.map((product, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-7">
                        <Label>Mahsulot nomi</Label>
                        <Input
                          placeholder="Masalan: Tormoz suyuqligi"
                          value={product.name}
                          onChange={(e) => {
                            const newProducts = [...formData.customProducts]
                            newProducts[index].name = e.target.value
                            setFormData({ ...formData, customProducts: newProducts })
                          }}
                        />
                      </div>
                      <div className="col-span-4">
                        <Label>Narxi (so'm)</Label>
                        <Input
                          type="text"
                          placeholder="50 000"
                          value={formatNumberWithSpaces(product.price)}
                          onChange={(e) => {
                            const numericValue = removeSpaces(e.target.value)
                            if (/^\d*$/.test(numericValue)) {
                              const newProducts = [...formData.customProducts]
                              newProducts[index].price = numericValue
                              setFormData({ ...formData, customProducts: newProducts })
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newProducts = formData.customProducts.filter((_, i) => i !== index)
                            setFormData({ ...formData, customProducts: newProducts })
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        customProducts: [...formData.customProducts, { name: '', price: '' }]
                      })
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yana mahsulot qo'shish
                  </Button>
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="space-y-4 border-b pb-6">
              <div>
                <Label htmlFor="laborCost">Ish haqi (UZS)</Label>
                <Input
                  type="text"
                  placeholder="50 000"
                  value={formatNumberWithSpaces(formData.laborCost)}
                  onChange={(e) => {
                    const numericValue = removeSpaces(e.target.value)
                    if (/^\d*$/.test(numericValue)) {
                      setFormData({ ...formData, laborCost: numericValue })
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Komissiya stavkalari asosida bo'linadi
                </p>
              </div>

              <div>
                <Label>Xodimlar * (Bir yoki bir nechtasini tanlang)</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {employees.map((emp) => (
                    <div key={emp._id} className="flex items-center gap-2">
                      <Checkbox
                        id={`employee-${emp._id}`}
                        checked={formData.employeeIds.includes(emp._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              employeeIds: [...formData.employeeIds, emp._id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              employeeIds: formData.employeeIds.filter(id => id !== emp._id)
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`employee-${emp._id}`} className="cursor-pointer flex-1 flex items-center justify-between">
                        <span>{emp.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.employeeIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.employeeIds.length} xodim tanlandi
                  </p>
                )}
              </div>

              {/* Employee Commission Control */}
              <EmployeeCommissionControl
                employees={employees}
                selectedEmployees={formData.employeeIds}
                laborCost={Number(formData.laborCost) || 0}
                commissions={employeeCommissions}
                onCommissionsChange={setEmployeeCommissions}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mileage">Hozirgi probeg (km) *</Label>
                  <Input
                    type="text"
                    placeholder="45 000"
                    value={formatNumberWithSpaces(formData.mileage)}
                    onChange={(e) => {
                      const numericValue = removeSpaces(e.target.value)
                      if (/^\d*$/.test(numericValue)) {
                        setFormData({
                          ...formData,
                          mileage: numericValue,
                          nextServiceMileage: numericValue ? String(Number(numericValue) + 5000) : ''
                        })
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nextServiceMileage">Keyingi xizmat probegi (km) *</Label>
                  <Input
                    type="text"
                    placeholder="50 000"
                    value={formatNumberWithSpaces(formData.nextServiceMileage)}
                    onChange={(e) => {
                      const numericValue = removeSpaces(e.target.value)
                      if (/^\d*$/.test(numericValue)) {
                        setFormData({ ...formData, nextServiceMileage: numericValue })
                      }
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Avtomatik: hozirgi probegdan +5000 km
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Xizmat haqida izohlar (Ixtiyoriy)</Label>
              <Textarea
                placeholder="Xizmat haqida qo'shimcha ma'lumotlar..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Payment Status */}
            <PaymentStatusSelector
              paymentStatus={formData.paymentStatus}
              amountPaid={formData.amountPaid}
              totalPrice={calculatePrice()}
              dueDate={formData.dueDate}
              onPaymentStatusChange={(status) => {
                setFormData({ 
                  ...formData, 
                  paymentStatus: status,
                  amountPaid: status === 'paid' ? String(calculatePrice()) : status === 'unpaid' ? '' : formData.amountPaid
                })
              }}
              onAmountPaidChange={(amount) => setFormData({ ...formData, amountPaid: amount })}
              onDueDateChange={(date) => setFormData({ ...formData, dueDate: date })}
            />

            {/* Price Summary */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mahsulotlar va qismlar:</span>
                  <span className="font-medium">{(calculatePrice() - (Number(formData.laborCost) || 0)).toLocaleString()} so'm</span>
                </div>
                {formData.laborCost && Number(formData.laborCost) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ish haqi:</span>
                    <span className="font-medium">{Number(formData.laborCost).toLocaleString()} so'm</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-foreground font-semibold">Jami narx:</span>
                <span className="text-2xl font-bold text-primary">{calculatePrice().toLocaleString()} so'm</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  'Xizmatni yakunlash'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOilChangeDialog(false)}
              >
                Bekor qilish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </>
      )}

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xizmat yakunlandi!</DialogTitle>
            <DialogDescription>Nima chop etishni tanlang</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base">Chop etish turini tanlang</Label>
              <div className="flex gap-4">
                <Button
                  variant={printType === 'sticker' ? 'default' : 'outline'}
                  onClick={() => setPrintType('sticker')}
                  className="flex-1"
                >
                  Stiker chop etish (58x40mm)
                </Button>
                <Button
                  variant={printType === 'receipt' ? 'default' : 'outline'}
                  onClick={() => setPrintType('receipt')}
                  className="flex-1"
                >
                  Kvitansiya chop etish
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-6 bg-card">
              {printType === 'sticker' ? (
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-base">58x40mm Sticker Preview</h3>
                  <div className="border-2 border-dashed p-3 inline-block relative">
                    <div className="text-xs space-y-1 text-left" style={{ paddingRight: '60px' }}>
                      <div className="text-center pb-1 mb-2">
                        <p className="font-bold text-sm">{tenant?.companyName || 'OILER.UZ'}</p>
                        <p className="text-[9px]">{tenant?.businessPhone || ''}</p>
                      </div>
                      
                      <p className="text-[10px]"><strong>Hozirgi:</strong> {(lastServiceData?.mileage || 0).toLocaleString()} km</p>
                      {lastServiceData?.nextServiceMileage && (
                        <p className="text-[10px]"><strong>Keyingi:</strong> {lastServiceData.nextServiceMileage.toLocaleString()} km</p>
                      )}
                      <p className="text-[10px]"><strong>Sana:</strong> {lastServiceData?.createdAt ? new Date(lastServiceData.createdAt).toLocaleDateString() : ''}</p>
                      
                      <div className="pt-1 space-y-0.5">
                        {(lastServiceData?.oilProduct || lastServiceData?.oilProductCustomerProvided || lastServiceData?.oilProductCustomerProvidedDetails) && (
                          <p className="text-[9px]">
                            <strong>Moy:</strong> {
                              lastServiceData.oilProductCustomerProvided || lastServiceData.oilProductCustomerProvidedDetails
                                ? (lastServiceData.oilProductCustomerProvidedDetails || 'Mijoz moy')
                                : typeof lastServiceData.oilProduct === 'object' && lastServiceData.oilProduct.viscosity
                                ? `${lastServiceData.oilProduct.brand || 'N/A'} ${lastServiceData.oilProduct.viscosity} ${lastServiceData.oilProduct.apiGrade || ''} (${lastServiceData.oilQuantityUsed}L)`.trim()
                                : 'N/A'
                            }
                          </p>
                        )}
                        {(lastServiceData?.oilFilter || lastServiceData?.oilFilterCustomerProvided || lastServiceData?.airFilter || lastServiceData?.airFilterCustomerProvided || lastServiceData?.cabinFilter || lastServiceData?.cabinFilterCustomerProvided || lastServiceData?.fuelFilter || lastServiceData?.fuelFilterCustomerProvided) && (
                          <p className="text-[9px]">
                            <strong>Filterlar:</strong>{' '}
                            {(lastServiceData?.oilFilter || lastServiceData?.oilFilterCustomerProvided) && 'Moy ✓'}{(lastServiceData?.oilFilter || lastServiceData?.oilFilterCustomerProvided) && (lastServiceData?.airFilter || lastServiceData?.airFilterCustomerProvided || lastServiceData?.cabinFilter || lastServiceData?.cabinFilterCustomerProvided || lastServiceData?.fuelFilter || lastServiceData?.fuelFilterCustomerProvided) && ', '}
                            {(lastServiceData?.airFilter || lastServiceData?.airFilterCustomerProvided) && 'Havo ✓'}{(lastServiceData?.airFilter || lastServiceData?.airFilterCustomerProvided) && (lastServiceData?.cabinFilter || lastServiceData?.cabinFilterCustomerProvided || lastServiceData?.fuelFilter || lastServiceData?.fuelFilterCustomerProvided) && ', '}
                            {(lastServiceData?.cabinFilter || lastServiceData?.cabinFilterCustomerProvided) && 'Salon ✓'}{(lastServiceData?.cabinFilter || lastServiceData?.cabinFilterCustomerProvided) && (lastServiceData?.fuelFilter || lastServiceData?.fuelFilterCustomerProvided) && ', '}
                            {(lastServiceData?.fuelFilter || lastServiceData?.fuelFilterCustomerProvided) && 'Yoqilg\'i ✓'}
                          </p>
                        )}
                        {lastServiceData?.employees && lastServiceData.employees.length > 0 && (
                          <p className="text-[9px]">
                            <strong>Xodim:</strong> {lastServiceData.employees.map((e: any) => typeof e === 'object' && e.name ? e.name : 'N/A').join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* QR Code - o'ng pastda */}
                    {qrCodeDataUrl && (
                      <div className="absolute bottom-2 right-2" style={{ width: '50px', height: '50px' }}>
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm space-y-3 rounded-lg border bg-muted/30 p-4">
                  <h3 className="font-bold text-lg text-center">Xizmat kvitansiyasi</h3>
                  <p className="text-center text-muted-foreground">
                    Chop etishda to&apos;liq kvitansiya chiqadi: kompaniya, mashina, mijoz, xizmat tarkibi,
                    to&apos;lov va QR kod.
                  </p>
                  <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
                    <p><strong className="text-foreground">Mashina:</strong> {vehicle.plateNumber}</p>
                    <p><strong className="text-foreground">Mijoz:</strong> {vehicle.customer?.name}</p>
                    <p>
                      <strong className="text-foreground">Jami:</strong>{' '}
                      {(lastServiceData?.totalPrice ?? lastServiceData?.price ?? 0).toLocaleString('uz-UZ')} so&apos;m
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="flex-1 gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Recording Dialog */}
      {canSection('ui.vehicle.payments') && debtSummary && (
        <PaymentRecordingDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          customerId={vehicle.customer?._id}
          customerName={vehicle.customer?.name || 'N/A'}
          totalDebt={debtSummary.totalDebt || 0}
          unpaidServices={[
            ...(debtSummary.unpaidOilChanges || []).map((s: any) => ({
              ...s,
              serviceType: 'oilChange' as const
            })),
            ...(debtSummary.unpaidServicesList || []).map((s: any) => ({
              ...s,
              serviceType: 'service' as const,
              serviceName: s.services?.[0]?.serviceName || 'Xizmat'
            }))
          ]}
          onPaymentRecorded={() => {
            // Refresh debt summary and payment history
            if (vehicle.customer?._id) {
              fetchDebtSummary(vehicle.customer._id)
            }
            fetchVehicleData()
          }}
        />
      )}

      {/* Edit General Service Dialog */}
      {canSection('ui.vehicle.history') && (
      <EditServiceDialog
        open={showEditGeneralServiceDialog}
        onClose={() => {
          setShowEditGeneralServiceDialog(false)
          setEditingGeneralServiceId('')
        }}
        serviceId={editingGeneralServiceId}
        onSuccess={() => {
          fetchVehicleData()
          if (vehicle.customer?._id) {
            fetchDebtSummary(vehicle.customer._id)
          }
        }}
      />
      )}

      {/* Add Service Dialog */}
      {canSection('ui.vehicle.oil_work') && (
      <AddServiceDialog
        open={showServiceDialog}
        onClose={() => setShowServiceDialog(false)}
        vehicleId={params.id as string}
        customerId={vehicle.customer?._id}
        onSuccess={() => {
          fetchVehicleData()
          if (vehicle.customer?._id) {
            fetchDebtSummary(vehicle.customer._id)
          }
        }}
      />
      )}

      {/* Unified Service History */}
      {canSection('ui.vehicle.history') && (
      <UnifiedServiceHistory
        vehicleId={params.id as string}
        onEdit={handleEditGeneralService}
        onDelete={(id, type) => {
          if (type === 'oilChange') {
            handleDeleteService(id)
          } else {
            handleDeleteGeneralService(id)
          }
        }}
        onPrint={(id, type) => {
          handlePrintA4(id, type)
        }}
        onViewHistory={(id, type) => {
          if (type === 'oilChange') {
            handleViewServiceHistory(id)
          } else {
            handleViewGeneralServiceHistory(id)
          }
        }}
        onComplete={handleCompleteService}
        onRefresh={fetchVehicleData}
      />
      )}

      {/* Complete Service Dialog */}
      {canSection('ui.vehicle.history') && (
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xizmatni tugatish</DialogTitle>
            <DialogDescription>
              Xizmat ma'lumotlarini ko'rib chiqing va tasdiqlang
            </DialogDescription>
          </DialogHeader>
          {completingServiceData && (
            <div className="space-y-4">
              {/* Vehicle Info */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-2">Mashina ma'lumotlari</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Raqam: </span>
                    <span className="font-medium">{data?.vehicle?.plateNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model: </span>
                    <span className="font-medium">{data?.vehicle?.brand} {data?.vehicle?.vehicleModel}</span>
                  </div>
                  {completingServiceData.mileage && (
                    <div>
                      <span className="text-muted-foreground">Probeg: </span>
                      <span className="font-medium">{completingServiceData.mileage.toLocaleString()} km</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Services Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-semibold">Xizmat</th>
                      <th className="text-left p-3 font-semibold">Mahsulotlar</th>
                      <th className="text-left p-3 font-semibold">Xodimlar</th>
                      <th className="text-right p-3 font-semibold">Narx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completingServiceData.services?.map((service: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3 align-top">
                          <div className="font-medium">{service.serviceName}</div>
                          {service.laborCost > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Ish haqi: {service.laborCost.toLocaleString()} so'm
                            </div>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          {service.items && service.items.length > 0 ? (
                            <div className="space-y-1">
                              {service.items.map((item: any, itemIdx: number) => (
                                <div key={itemIdx} className="text-xs">
                                  • {item.itemName} ({item.quantity} x {item.unitPrice.toLocaleString()})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          {service.employees && service.employees.length > 0 ? (
                            <div className="text-xs">
                              {service.employees.map((emp: any) => emp.name).join(', ')}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 align-top text-right font-medium">
                          {service.totalPrice.toLocaleString()} so'm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 border-t-2">
                    <tr>
                      <td colSpan={3} className="p-3 text-right font-semibold">
                        Jami:
                      </td>
                      <td className="p-3 text-right font-bold text-lg">
                        {completingServiceData.totalPrice.toLocaleString()} so'm
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Info */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-2">To'lov ma'lumotlari</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Holat: </span>
                    {completingServiceData.paymentStatus === 'paid' && (
                      <Badge variant="default" className="bg-green-600">To'langan</Badge>
                    )}
                    {completingServiceData.paymentStatus === 'partial' && (
                      <Badge variant="secondary">Qisman</Badge>
                    )}
                    {completingServiceData.paymentStatus === 'unpaid' && (
                      <Badge variant="destructive">To'lanmagan</Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">To'langan: </span>
                    <span className="font-medium">{completingServiceData.amountPaid.toLocaleString()} so'm</span>
                  </div>
                  {completingServiceData.amountDue > 0 && (
                    <div>
                      <span className="text-muted-foreground">Qarz: </span>
                      <span className="font-medium text-destructive">{completingServiceData.amountDue.toLocaleString()} so'm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {completingServiceData.notes && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold mb-2">Izohlar</h3>
                  <p className="text-sm text-muted-foreground">{completingServiceData.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={confirmCompleteService} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Tasdiqlash va tugatish
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCompleteDialog(false)
                    setCompletingServiceId('')
                    setCompletingServiceData(null)
                  }}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      )}

      {lastServiceData && (
        <ServicePrintReceipt
          vehicle={vehicle}
          tenant={tenant}
          companySettings={companySettings}
          lastServiceData={lastServiceData}
          printType={printType}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      )}
    </div>
  )
}
