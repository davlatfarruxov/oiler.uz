'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Plus, Printer, Trash2, History } from 'lucide-react'
import { PaymentStatusSelector } from '@/components/PaymentStatusSelector'
import { CustomerDebtCard } from '@/components/CustomerDebtCard'
import { PaymentHistoryTable } from '@/components/PaymentHistoryTable'
import { PaymentRecordingDialog } from '@/components/PaymentRecordingDialog'
import { AddServiceDialog } from '@/components/AddServiceDialog'
import { UnifiedServiceHistory } from '@/components/UnifiedServiceHistory'
import { EditServiceDialog } from '@/components/EditServiceDialog'

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
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
  const [showA4Print, setShowA4Print] = useState(false)
  const [printServiceData, setPrintServiceData] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [showAdditionalProducts, setShowAdditionalProducts] = useState(false)
  const [showEditVehicle, setShowEditVehicle] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [editEngineType, setEditEngineType] = useState('')
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
  const [editServiceFuelFilterCustomerProvided, setEditServiceFuelFilterCustomerProvided] = useState(false)

  // Customer debt state
  const [debtSummary, setDebtSummary] = useState<any>(null)
  const [loadingDebt, setLoadingDebt] = useState(false)
  
  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false)
  
  // Payment recording dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

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
      setCompanySettings(response.data.data)
    } catch (error) {
      console.error('Failed to load company settings:', error)
    }
  }

  const fetchDebtSummary = async (customerId: string) => {
    try {
      setLoadingDebt(true)
      const response = await api.get(`/payments/customer/${customerId}/summary`)
      setDebtSummary(response.data.data)
      
      // Also fetch payment history
      fetchPaymentHistory(customerId)
    } catch (error) {
      console.error('Failed to load debt summary:', error)
    } finally {
      setLoadingDebt(false)
    }
  }

  const fetchPaymentHistory = async (customerId: string) => {
    try {
      setLoadingPaymentHistory(true)
      const response = await api.get(`/payments/customer/${customerId}/history`)
      setPaymentHistory(response.data.data || [])
    } catch (error) {
      console.error('Failed to load payment history:', error)
    } finally {
      setLoadingPaymentHistory(false)
    }
  }

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
        const response = await api.get(`/oil-changes/${serviceId}`)
        const service = response.data.data
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
    if (!confirm('Are you sure you want to delete this service? It will be moved to archive.')) return

    try {
      await api.post(`/oil-changes/${serviceId}/archive`, {
        reason: 'Deleted from vehicle detail page'
      })
      alert('Service deleted successfully')
      fetchVehicleData() // Reload data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete service')
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
    setEditServiceEmployeeIds(service.employees?.map((e: any) => e._id) || [])
    setShowEditService(true)
  }

  const handleUpdateService = async () => {
    if (!editingService) return

    try {
      const mileage = (document.getElementById('edit-service-mileage') as HTMLInputElement)?.value
      const nextServiceMileage = (document.getElementById('edit-service-next-mileage') as HTMLInputElement)?.value
      const laborCost = (document.getElementById('edit-service-labor') as HTMLInputElement)?.value
      const price = (document.getElementById('edit-service-price') as HTMLInputElement)?.value
      const oilQuantityUsed = (document.getElementById('edit-oil-quantity') as HTMLInputElement)?.value

      if (!mileage || !nextServiceMileage || !price) {
        alert('Please fill all required fields')
        return
      }

      const updateData: any = {
        mileage: Number(mileage),
        nextServiceMileage: Number(nextServiceMileage),
        laborCost: Number(laborCost) || 0,
        price: Number(price),
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
      const oldEmployeeIds = editingService.employees?.map((e: any) => e._id).sort().join(',') || ''
      const newEmployeeIds = editServiceEmployeeIds.sort().join(',')
      if (oldEmployeeIds !== newEmployeeIds) {
        updateData.employeeIds = editServiceEmployeeIds
      }

      await api.put(`/oil-changes/${editingService._id}`, updateData)

      alert('Service updated successfully')
      setShowEditService(false)
      setEditingService(null)
      fetchVehicleData() // Reload data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update service')
    }
  }

  const handleUpdateVehicle = async () => {
    try {
      const brand = (document.getElementById('edit-brand') as HTMLInputElement)?.value
      const vehicleModel = (document.getElementById('edit-model') as HTMLInputElement)?.value
      const engineType = editEngineType || data?.vehicle?.engineType

      if (!brand || !vehicleModel || !engineType) {
        alert('Please fill all fields')
        return
      }

      await api.put(`/vehicles/${params.id}`, {
        brand,
        vehicleModel,
        engineType
      })

      alert('Vehicle updated successfully')
      setShowEditVehicle(false)
      fetchVehicleData() // Reload data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update vehicle')
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
        price: calculatePrice(),
        // Payment fields
        paymentStatus: formData.paymentStatus,
        amountPaid: formData.paymentStatus === 'paid' ? calculatePrice() : 
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

      await api.post('/oil-changes', oilChangeData)

      // Save last service data for printing
      const selectedOilProduct = oilProducts.find(p => p._id === formData.oilProductId)
      setLastServiceData({
        ...oilChangeData,
        date: new Date(),
        oilFilterName: oilFilters.find(f => f._id === formData.oilFilterId)?.displayName,
        airFilterName: airFilters.find(f => f._id === formData.airFilterId)?.displayName,
        cabinFilterName: cabinFilters.find(f => f._id === formData.cabinFilterId)?.displayName,
        fuelFilterName: fuelFilters.find(f => f._id === formData.fuelFilterId)?.displayName,
        oilProductName: selectedOilProduct?.displayName
      })

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



  const handlePrint = () => {
    window.print()
  }

  const handlePrintService = (service: any) => {
    setLastServiceData({
      vehicleId: service.vehicle,
      customerId: service.customer,
      employeeId: service.employee?._id,
      oilProductId: service.oilProduct?._id,
      oilFilterId: service.oilFilter?._id,
      additionalProducts: service.additionalProducts || [],
      mileage: service.mileage,
      nextServiceMileage: service.nextServiceMileage,
      laborCost: service.laborCost || 0,
      price: service.price,
      date: new Date(service.createdAt),
      filterName: service.oilFilter?.name,
      oilProductName: service.oilProduct?.displayName || `${service.oilProduct?.brand} ${service.oilProduct?.viscosity} ${service.oilProduct?.apiGrade} ${service.oilProduct?.volume}L`
    })
    setPrintType('sticker')
    setShowPrintPreview(true)
  }

  const handlePrintA4 = async (id: string, type: 'oilChange' | 'service') => {
    try {
      let serviceData
      
      if (type === 'oilChange') {
        const response = await api.get(`/oil-changes/${id}`)
        serviceData = response.data.data
      } else {
        const response = await api.get(`/services/${id}`)
        serviceData = response.data.data
      }
      
      setPrintServiceData({ ...serviceData, type })
      setShowA4Print(true)
      
      // Wait for state to update and DOM to render, then print
      setTimeout(() => {
        window.print()
        // Close print preview after printing
        setTimeout(() => {
          setShowA4Print(false)
          setPrintServiceData(null)
        }, 1000)
      }, 1000)
    } catch (error) {
      console.error('Print error:', error)
      alert('Xizmatni yuklashda xatolik yuz berdi')
    }
  }

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
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-a4-area {
            display: block !important;
          }
          .no-print {
            display: block !important;
          }
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-sticker-area,
          .print-sticker-area * {
            visibility: visible !important;
          }
          .print-sticker-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            height: 40mm !important;
            padding: 2mm !important;
            box-sizing: border-box !important;
            font-family: Arial, sans-serif !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            text-align: center !important;
          }
          .print-a4-area,
          .print-a4-area * {
            visibility: visible !important;
          }
          .print-a4-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20mm !important;
            box-sizing: border-box !important;
            font-family: Arial, sans-serif !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}} />
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
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setShowOilChangeDialog(true)}>
            <Plus className="w-4 h-4" />
            New Oil Change
          </Button>
          <Button className="gap-2" variant="outline" onClick={() => setShowServiceDialog(true)}>
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Services</p>
            <p className="text-2xl font-bold text-foreground mt-2">{totalServices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Last Service</p>
            <p className="text-lg font-semibold text-foreground mt-2">
              {lastService ? new Date(lastService.createdAt).toLocaleDateString() : 'Never'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Engine Type</p>
            <Badge variant="outline" className="mt-2 capitalize">{vehicle.engineType}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Customer Debt Card */}
      {debtSummary && (
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

      {/* Payment History Table */}
      {paymentHistory.length > 0 && (
        <Card id="payment-history-section">
          <CardHeader>
            <CardTitle>To'lov tarixi</CardTitle>
            <CardDescription>Barcha xizmatlar va to'lovlar tarixi</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPaymentHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PaymentHistoryTable
                transactions={paymentHistory}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vehicle Information</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleViewHistory}>
              <History className="w-4 h-4 mr-2" />
              Ta'rix
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEditVehicle(true)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteVehicle()}>
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Plate Number</dt>
              <dd className="text-lg font-bold text-primary mt-1">{vehicle.plateNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Vehicle</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{vehicle.brand} {vehicle.vehicleModel}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Customer</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{vehicle.customer?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{vehicle.customer?.phone || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Edit Vehicle Modal */}
      <Dialog open={showEditVehicle} onOpenChange={setShowEditVehicle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update vehicle information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plate Number</Label>
              <Input value={vehicle.plateNumber} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Plate number cannot be changed</p>
            </div>
            <div>
              <Label>Brand</Label>
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
              <Label>Engine Type</Label>
              <Select 
                defaultValue={vehicle.engineType}
                onValueChange={(value) => setEditEngineType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateVehicle} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setShowEditVehicle(false)}>
                Cancel
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
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information - Vehicle: {vehicle.plateNumber}
            </DialogDescription>
          </DialogHeader>
          {editingService && (
            <div className="space-y-6">
              {/* Oil Product */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-3">Oil Product</h3>
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
                      Customer provided their own oil
                    </Label>
                  </div>

                  {editServiceOilProductCustomerProvided ? (
                    <div>
                      <Label>Oil Details</Label>
                      <Input
                        id="edit-oil-product-details"
                        placeholder="e.g., Mobil 5W-30 SN 4L"
                        defaultValue={editingService.oilProductCustomerProvidedDetails || ''}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label>Select Oil Product</Label>
                      <Select 
                        value={editServiceOilProductId}
                        onValueChange={setEditServiceOilProductId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select oil product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {oilProducts.map((product) => (
                            <SelectItem key={product._id} value={product._id}>
                              {product.displayName} (Stock: {product.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Quantity Used (L)</Label>
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
                <h3 className="font-semibold text-foreground mb-3">Filters</h3>
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
                        Customer provided oil filter
                      </Label>
                    </div>
                    {editServiceOilFilterCustomerProvided ? (
                      <Input
                        id="edit-oil-filter-details"
                        placeholder="Oil filter details"
                        defaultValue={editingService.oilFilterCustomerProvidedDetails || ''}
                        className="text-sm"
                      />
                    ) : (
                      <Select 
                        value={editServiceOilFilterId}
                        onValueChange={setEditServiceOilFilterId}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select oil filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {oilFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filter.brandName || filter.brand} {filter.partNumber} (Stock: {filter.stock})
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
                        Customer provided air filter
                      </Label>
                    </div>
                    {editServiceAirFilterCustomerProvided ? (
                      <Input
                        id="edit-air-filter-details"
                        placeholder="Air filter details"
                        defaultValue={editingService.airFilterCustomerProvidedDetails || ''}
                        className="text-sm"
                      />
                    ) : (
                      <Select 
                        value={editServiceAirFilterId}
                        onValueChange={setEditServiceAirFilterId}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select air filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {airFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filter.brandName || filter.brand} {filter.partNumber} (Stock: {filter.stock})
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
                        Customer provided cabin filter
                      </Label>
                    </div>
                    {editServiceCabinFilterCustomerProvided ? (
                      <Input
                        id="edit-cabin-filter-details"
                        placeholder="Cabin filter details"
                        defaultValue={editingService.cabinFilterCustomerProvidedDetails || ''}
                        className="text-sm"
                      />
                    ) : (
                      <Select 
                        value={editServiceCabinFilterId}
                        onValueChange={setEditServiceCabinFilterId}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select cabin filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {cabinFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filter.brandName || filter.brand} {filter.partNumber} (Stock: {filter.stock})
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
                        Customer provided fuel filter
                      </Label>
                    </div>
                    {editServiceFuelFilterCustomerProvided ? (
                      <Input
                        id="edit-fuel-filter-details"
                        placeholder="Fuel filter details"
                        defaultValue={editingService.fuelFilterCustomerProvidedDetails || ''}
                        className="text-sm"
                      />
                    ) : (
                      <Select 
                        value={editServiceFuelFilterId}
                        onValueChange={setEditServiceFuelFilterId}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select fuel filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {fuelFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filter.brandName || filter.brand} {filter.partNumber} (Stock: {filter.stock})
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
                <h3 className="font-semibold text-foreground mb-3">Employees</h3>
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
                        {emp.name} - Commission: {emp.commissionRate}%
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Changing employees will recalculate commissions based on labor cost.
                </p>
              </div>

              {/* Mileage & Service Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-3">Mileage & Service Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-service-mileage">Current Mileage (km) *</Label>
                    <Input
                      id="edit-service-mileage"
                      type="number"
                      defaultValue={editingService.mileage}
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-service-next-mileage">Next Service Mileage (km) *</Label>
                    <Input
                      id="edit-service-next-mileage"
                      type="number"
                      defaultValue={editingService.nextServiceMileage}
                      placeholder="e.g., 55000"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-service-labor">Labor Cost (so'm)</Label>
                    <Input
                      id="edit-service-labor"
                      type="number"
                      defaultValue={editingService.laborCost || 0}
                      placeholder="e.g., 50000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for employee commission calculation
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="edit-service-price">Total Price (so'm) *</Label>
                    <Input
                      id="edit-service-price"
                      type="number"
                      defaultValue={editingService.price}
                      placeholder="e.g., 250000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Final price charged to customer
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Products */}
              {editingService.additionalProducts && editingService.additionalProducts.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-foreground mb-3">Additional Products</h3>
                  <div className="space-y-2">
                    {editingService.additionalProducts.map((prod: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                        <span>{prod.product?.name || 'Unknown'}</span>
                        <span>Qty: {prod.quantity} × ${prod.price}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Additional products cannot be changed after service creation.
                  </p>
                </div>
              )}

              {/* Service Date */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Service Date</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(editingService.createdAt).toLocaleString('en-US', {
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
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditService(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <DialogTitle>New Oil Change Service</DialogTitle>
            <DialogDescription>
              Vehicle: {vehicle.plateNumber} - {vehicle.brand} {vehicle.vehicleModel}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Info */}
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-semibold text-foreground mb-3">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Brand/Model</p>
                  <p className="font-medium text-foreground">{vehicle.brand} {vehicle.vehicleModel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Engine</p>
                  <p className="font-medium text-foreground capitalize">{vehicle.engineType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{vehicle.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
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
                  Customer provided their own oil
                </Label>
              </div>

              {formData.oilProductCustomerProvided ? (
                <div>
                  <Label htmlFor="oilProductCustomerProvidedDetails">Oil Details *</Label>
                  <Input
                    id="oilProductCustomerProvidedDetails"
                    placeholder="e.g., Mobil 5W-30 SN 4L"
                    value={formData.oilProductCustomerProvidedDetails}
                    onChange={(e) => setFormData({ ...formData, oilProductCustomerProvidedDetails: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter oil brand, viscosity, and volume
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Oil Product *</h3>
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
                      <SelectValue placeholder="Select oil product" />
                    </SelectTrigger>
                    <SelectContent>
                      {oilProducts.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No oil products available</div>
                      ) : (
                        oilProducts.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.displayName} - {(product.price || 0).toLocaleString()} so'm ({product.stock || 0} in stock)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.oilProductId || formData.oilProductCustomerProvided) && (
                <div>
                  <Label htmlFor="oilQuantityUsed">Oil Quantity Used (Liters) *</Label>
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
                          Container: {selectedProduct.volume}L • Price/L: {pricePerLiter.toFixed(2)} so'm •
                          Total oil cost: {calculatedPrice.toFixed(2)} so'm
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
              <h3 className="font-semibold text-foreground text-lg">Filters (Optional)</h3>

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
                    Customer provided their own oil filter
                  </Label>
                </div>

                {formData.oilFilterCustomerProvided ? (
                  <div>
                    <Label htmlFor="oilFilterCustomerProvidedDetails">Oil Filter Details</Label>
                    <Input
                      id="oilFilterCustomerProvidedDetails"
                      placeholder="e.g., Mann W 712/75"
                      value={formData.oilFilterCustomerProvidedDetails}
                      onChange={(e) => setFormData({ ...formData, oilFilterCustomerProvidedDetails: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Oil Filter</Label>
                    <Select value={formData.oilFilterId} onValueChange={(value) => setFormData({ ...formData, oilFilterId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select oil filter (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {oilFilters.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No oil filters available</div>
                        ) : (
                          oilFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filter.displayName || `${filter.brandName} ${filter.partNumber}`} - {(filter.price || 0).toLocaleString()} so'm ({filter.stock || 0} in stock)
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
                    Customer provided their own air filter
                  </Label>
                </div>

                {formData.airFilterCustomerProvided ? (
                  <div>
                    <Label htmlFor="airFilterCustomerProvidedDetails">Air Filter Details</Label>
                    <Input
                      id="airFilterCustomerProvidedDetails"
                      placeholder="e.g., Mann C 27 011"
                      value={formData.airFilterCustomerProvidedDetails}
                      onChange={(e) => setFormData({ ...formData, airFilterCustomerProvidedDetails: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Air Filter</Label>
                    <Select value={formData.airFilterId} onValueChange={(value) => setFormData({ ...formData, airFilterId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select air filter (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {airFilters.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No air filters available</div>
                        ) : (
                          airFilters.map((filter) => (
                            <SelectItem key={filter._id} value={filter._id}>
                              {filter.displayName || `${filter.brandName} ${filter.partNumber}`} - {(filter.price || 0).toLocaleString()} so'm ({filter.stock || 0} in stock)
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
                  Add More Filters (Cabin & Fuel)
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
                        Customer provided their own cabin filter
                      </Label>
                    </div>

                    {formData.cabinFilterCustomerProvided ? (
                      <div>
                        <Label htmlFor="cabinFilterCustomerProvidedDetails">Cabin Filter Details</Label>
                        <Input
                          id="cabinFilterCustomerProvidedDetails"
                          placeholder="e.g., Mann CU 2882"
                          value={formData.cabinFilterCustomerProvidedDetails}
                          onChange={(e) => setFormData({ ...formData, cabinFilterCustomerProvidedDetails: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Cabin Filter</Label>
                        <Select value={formData.cabinFilterId} onValueChange={(value) => setFormData({ ...formData, cabinFilterId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cabin filter (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {cabinFilters.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">No cabin filters available</div>
                            ) : (
                              cabinFilters.map((filter) => (
                                <SelectItem key={filter._id} value={filter._id}>
                                  {filter.displayName || `${filter.brandName} ${filter.partNumber}`} - {(filter.price || 0).toLocaleString()} so'm ({filter.stock || 0} in stock)
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
                        Customer provided their own fuel filter
                      </Label>
                    </div>

                    {formData.fuelFilterCustomerProvided ? (
                      <div>
                        <Label htmlFor="fuelFilterCustomerProvidedDetails">Fuel Filter Details</Label>
                        <Input
                          id="fuelFilterCustomerProvidedDetails"
                          placeholder="e.g., Mann WK 853/3"
                          value={formData.fuelFilterCustomerProvidedDetails}
                          onChange={(e) => setFormData({ ...formData, fuelFilterCustomerProvidedDetails: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Fuel Filter</Label>
                        <Select value={formData.fuelFilterId} onValueChange={(value) => setFormData({ ...formData, fuelFilterId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fuel filter (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {fuelFilters.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">No fuel filters available</div>
                            ) : (
                              fuelFilters.map((filter) => (
                                <SelectItem key={filter._id} value={filter._id}>
                                  {filter.displayName || `${filter.brandName} ${filter.partNumber}`} - {filter.price.toLocaleString()} so'm ({filter.stock} in stock)
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
              <h3 className="font-semibold text-foreground">Other Products (Optional)</h3>

              {/* Show Additional Products Button */}
              {!showAdditionalProducts && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdditionalProducts(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Other Products
                </Button>
              )}

              {/* Custom Products Input */}
              {showAdditionalProducts && (
                <div className="space-y-3">
                  {formData.customProducts.map((product, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-7">
                        <Label>Product Name</Label>
                        <Input
                          placeholder="e.g., Brake Fluid"
                          value={product.name}
                          onChange={(e) => {
                            const newProducts = [...formData.customProducts]
                            newProducts[index].name = e.target.value
                            setFormData({ ...formData, customProducts: newProducts })
                          }}
                        />
                      </div>
                      <div className="col-span-4">
                        <Label>Price (so'm)</Label>
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
                    Add Another Product
                  </Button>
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="space-y-4 border-b pb-6">
              <div>
                <Label>Employees * (Select one or more)</Label>
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
                    {formData.employeeIds.length} employee(s) selected
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="laborCost">Labor Cost (UZS)</Label>
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
                    Will be split based on commission rates
                  </p>
                </div>
                <div>
                  <Label htmlFor="mileage">Current Mileage (km) *</Label>
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
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-b pb-6">
              <div>
                <Label htmlFor="nextServiceMileage">Next Service Mileage (km) *</Label>
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
                  Auto: +5000 km from current
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Service Notes (Optional)</Label>
              <Textarea
                placeholder="Any additional notes about the service..."
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
                  <span className="text-muted-foreground">Products & Parts:</span>
                  <span className="font-medium">{(calculatePrice() - (Number(formData.laborCost) || 0)).toLocaleString()} so'm</span>
                </div>
                {formData.laborCost && Number(formData.laborCost) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Labor Cost:</span>
                    <span className="font-medium">{Number(formData.laborCost).toLocaleString()} so'm</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-foreground font-semibold">Total Price:</span>
                <span className="text-2xl font-bold text-primary">{calculatePrice().toLocaleString()} so'm</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Service'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOilChangeDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Service Completed!</DialogTitle>
            <DialogDescription>Choose what you'd like to print</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base">Select Print Type</Label>
              <div className="flex gap-4">
                <Button
                  variant={printType === 'sticker' ? 'default' : 'outline'}
                  onClick={() => setPrintType('sticker')}
                  className="flex-1"
                >
                  Print Sticker (58x40mm)
                </Button>
                <Button
                  variant={printType === 'receipt' ? 'default' : 'outline'}
                  onClick={() => setPrintType('receipt')}
                  className="flex-1"
                >
                  Print Receipt
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-6 bg-card">
              {printType === 'sticker' ? (
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-base">58x40mm Sticker Preview</h3>
                  <div className="border-2 border-dashed p-3 inline-block" style={{ width: '232px', height: '160px' }}>
                    <div className="text-xs space-y-1 flex flex-col justify-center h-full">
                      <p className="font-bold text-sm">{vehicle.plateNumber}</p>
                      <p className="text-[10px]">{vehicle.brand} {vehicle.vehicleModel}</p>
                      <p className="text-[10px]">{lastServiceData?.oilProductName || 'N/A'}</p>
                      <p className="text-[10px]">{lastServiceData?.date ? new Date(lastServiceData.date).toLocaleDateString() : ''}</p>
                      <p className="text-[10px] border-t pt-1 mt-1">Next: {lastServiceData?.nextServiceMileage || (lastServiceData?.mileage ? Number(lastServiceData.mileage) + 5000 : '')} km</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm space-y-3">
                  <h3 className="font-bold text-lg text-center">SERVICE RECEIPT</h3>
                  <div className="border-b pb-2">
                    <p><strong>Vehicle:</strong> {vehicle.plateNumber}</p>
                    <p><strong>Customer:</strong> {vehicle.customer?.name}</p>
                    <p><strong>Current Mileage:</strong> {lastServiceData?.mileage} km</p>
                    <p><strong>Next Service:</strong> {lastServiceData?.nextServiceMileage || (lastServiceData?.mileage ? Number(lastServiceData.mileage) + 5000 : '')} km</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="font-semibold mb-1">Services:</p>
                    <p>Oil Change - {lastServiceData?.oilProductName || 'N/A'}</p>
                    <p>Oil Filter - {lastServiceData?.filterName}</p>
                    {lastServiceData?.additionalProducts?.map((item: any) => {
                      const product = additionalProducts.find(p => p._id === item.productId)
                      return product ? <p key={item.productId}>{product.name}</p> : null
                    })}
                    {lastServiceData?.laborCost && lastServiceData.laborCost > 0 && (
                      <p>Labor Cost - ${lastServiceData.laborCost.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${lastServiceData?.price?.toFixed(2)}</span>
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

      {/* Hidden Print Area */}
      {lastServiceData && (
        <div className="print-sticker-area" style={{ display: 'none' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2mm' }}>
            {vehicle.plateNumber}
          </div>
          <div style={{ fontSize: '9px', marginBottom: '1mm' }}>
            {vehicle.brand} {vehicle.vehicleModel}
          </div>
          <div style={{ fontSize: '9px', marginBottom: '1mm' }}>
            {lastServiceData.oilProductName || 'N/A'}
          </div>
          <div style={{ fontSize: '8px', marginBottom: '2mm' }}>
            {new Date(lastServiceData.date).toLocaleDateString()}
          </div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '1mm', fontSize: '8px', fontWeight: 'bold' }}>
            Next Service: {lastServiceData.nextServiceMileage || (Number(lastServiceData.mileage) + 5000)} km
          </div>
        </div>
      )}

      {/* Payment Recording Dialog */}
      {debtSummary && (
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

      {/* Add Service Dialog */}
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

      {/* A4 Print Area - Hidden on screen, visible on print */}
      {showA4Print && printServiceData && (
        <div className="print-a4-area fixed inset-0 bg-white z-50 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
          {/* Company Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #000', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {companySettings?.companyName || 'OILER.UZ'}
            </h1>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>
              {companySettings?.businessPhone && (
                <p style={{ margin: '5px 0', fontWeight: '500' }}>
                  📞 Tel: {companySettings.businessPhone}
                </p>
              )}
              {companySettings?.businessEmail && (
                <p style={{ margin: '5px 0' }}>
                  ✉️ Email: {companySettings.businessEmail}
                </p>
              )}
              {companySettings?.address && (
                <p style={{ margin: '5px 0' }}>
                  📍 Manzil: {companySettings.address}
                </p>
              )}
            </div>
          </div>

          {/* Service Information */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
              XIZMAT MA'LUMOTLARI
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', width: '30%' }}>Sana:</td>
                  <td style={{ padding: '8px' }}>{new Date(printServiceData.createdAt).toLocaleDateString('uz-UZ', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Avtomobil:</td>
                  <td style={{ padding: '8px' }}>{vehicle.plateNumber} - {vehicle.brand} {vehicle.vehicleModel}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Mijoz:</td>
                  <td style={{ padding: '8px' }}>{vehicle.customer?.name || 'N/A'}</td>
                </tr>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Telefon:</td>
                  <td style={{ padding: '8px' }}>{vehicle.customer?.phone || 'N/A'}</td>
                </tr>
                {printServiceData.mileage && (
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Probeg:</td>
                    <td style={{ padding: '8px' }}>{printServiceData.mileage.toLocaleString()} km</td>
                  </tr>
                )}
                {printServiceData.nextServiceMileage && (
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Keyingi xizmat:</td>
                    <td style={{ padding: '8px' }}>{printServiceData.nextServiceMileage.toLocaleString()} km</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Service Details Table */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
              {printServiceData.type === 'oilChange' ? 'MOY ALMASHTIRISH' : 'ISH SESSIYASI'}
            </h2>

            {printServiceData.type === 'oilChange' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#333', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Mahsulot</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Tafsilot</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Narx</th>
                  </tr>
                </thead>
                <tbody>
                  {printServiceData.oilProduct && (
                    <tr>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Moy</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {printServiceData.oilProduct.displayName || printServiceData.oilProduct.brand}
                        {printServiceData.oilQuantityUsed && ` (${printServiceData.oilQuantityUsed}L)`}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        {((printServiceData.oilProduct.price / printServiceData.oilProduct.volume) * printServiceData.oilQuantityUsed).toLocaleString()} so'm
                      </td>
                    </tr>
                  )}
                  {printServiceData.oilFilter && (
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Moy filteri</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {printServiceData.oilFilter.displayName || printServiceData.oilFilter.name}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        {printServiceData.oilFilter.price?.toLocaleString()} so'm
                      </td>
                    </tr>
                  )}
                  {printServiceData.airFilter && (
                    <tr>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Havo filteri</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {printServiceData.airFilter.displayName || printServiceData.airFilter.name}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        {printServiceData.airFilter.price?.toLocaleString()} so'm
                      </td>
                    </tr>
                  )}
                  {printServiceData.cabinFilter && (
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Salon filteri</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {printServiceData.cabinFilter.displayName || printServiceData.cabinFilter.name}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        {printServiceData.cabinFilter.price?.toLocaleString()} so'm
                      </td>
                    </tr>
                  )}
                  {printServiceData.fuelFilter && (
                    <tr>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Yoqilg'i filteri</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {printServiceData.fuelFilter.displayName || printServiceData.fuelFilter.name}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        {printServiceData.fuelFilter.price?.toLocaleString()} so'm
                      </td>
                    </tr>
                  )}
                  {printServiceData.laborCost > 0 && (
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Ish haqi</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {printServiceData.employees?.map((e: any) => e.name).join(', ')}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                        {printServiceData.laborCost.toLocaleString()} so'm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#333', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Xizmat</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Mahsulotlar</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Xodimlar</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Narx</th>
                  </tr>
                </thead>
                <tbody>
                  {printServiceData.services?.map((service: any, idx: number) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                        <strong>{service.serviceName}</strong>
                        {service.laborCost > 0 && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            Ish haqi: {service.laborCost.toLocaleString()} so'm
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                        {service.items && service.items.length > 0 ? (
                          <div>
                            {service.items.map((item: any, itemIdx: number) => (
                              <div key={itemIdx} style={{ fontSize: '13px', marginBottom: '3px' }}>
                                • {item.itemName} ({item.quantity} x {item.unitPrice.toLocaleString()} so'm)
                              </div>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                        {service.employees && service.employees.length > 0 
                          ? service.employees.map((emp: any) => emp.name).join(', ')
                          : '-'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', verticalAlign: 'top' }}>
                        <strong>{service.totalPrice.toLocaleString()} so'm</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Total and Payment */}
          <div style={{ marginTop: '30px', borderTop: '3px solid #000', paddingTop: '20px' }}>
            <table style={{ width: '100%', fontSize: '16px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>JAMI:</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '24px', width: '200px' }}>
                    {printServiceData.price?.toLocaleString()} so'm
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', textAlign: 'right' }}>To'lov holati:</td>
                  <td style={{ padding: '10px', textAlign: 'right', width: '200px' }}>
                    {printServiceData.paymentStatus === 'paid' ? 'To\'langan' : 
                     printServiceData.paymentStatus === 'partial' ? 'Qisman to\'langan' : 
                     'To\'lanmagan'}
                  </td>
                </tr>
                {printServiceData.amountPaid > 0 && (
                  <tr>
                    <td style={{ padding: '10px', textAlign: 'right' }}>To'langan:</td>
                    <td style={{ padding: '10px', textAlign: 'right', width: '200px' }}>
                      {printServiceData.amountPaid.toLocaleString()} so'm
                    </td>
                  </tr>
                )}
                {printServiceData.amountDue > 0 && (
                  <tr>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#dc2626' }}>Qarz:</td>
                    <td style={{ padding: '10px', textAlign: 'right', width: '200px', color: '#dc2626', fontWeight: 'bold' }}>
                      {printServiceData.amountDue.toLocaleString()} so'm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {printServiceData.notes && (
            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #333' }}>
              <strong>Izoh:</strong> {printServiceData.notes}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
            <p>Xizmatimizdan foydalanganingiz uchun rahmat!</p>
            <p>{companySettings?.companyName || 'OILER.UZ'} - Professional avtomobil xizmati</p>
          </div>
          
          {/* Close button - only visible on screen, not on print */}
          <div className="no-print mt-8 text-center">
            <Button 
              onClick={() => {
                setShowA4Print(false)
                setPrintServiceData(null)
              }}
              variant="outline"
              size="lg"
            >
              Yopish
            </Button>
          </div>
          </div>
        </div>
      )}

      {/* Unified Service History */}
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
      />
    </div>
  )
}
