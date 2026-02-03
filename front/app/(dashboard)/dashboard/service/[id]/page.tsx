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
import { Loader2, ArrowLeft, Plus, Printer, Trash2 } from 'lucide-react'

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOilChangeDialog, setShowOilChangeDialog] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [printType, setPrintType] = useState<'sticker' | 'receipt'>('receipt')
  const [isSaving, setIsSaving] = useState(false)
  const [lastServiceData, setLastServiceData] = useState<any>(null)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [showAdditionalProducts, setShowAdditionalProducts] = useState(false)

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
  })

  useEffect(() => {
    fetchVehicleData()
    fetchFormData()
  }, [params.id])

  const fetchVehicleData = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/vehicles/${params.id}/history`)
      setData(response.data.data)
    } catch (error) {
      alert('Failed to load vehicle data')
      router.back()
    } finally {
      setIsLoading(false)
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
        price: calculatePrice()
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const { vehicle, oilChanges, totalServices, lastService } = data

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{
        __html: `
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
          @page {
            size: 58mm 40mm;
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
            <p className="text-muted-foreground mt-1">{vehicle.brand} {vehicle.model}</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setShowOilChangeDialog(true)}>
          <Plus className="w-4 h-4" />
          New Oil Change
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Plate Number</dt>
              <dd className="text-lg font-bold text-primary mt-1">{vehicle.plateNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Vehicle</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{vehicle.brand} {vehicle.model}</dd>
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
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{service.price.toLocaleString()} so'm</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => handlePrintService(service)}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Oil Change Dialog */}
      <Dialog open={showOilChangeDialog} onOpenChange={setShowOilChangeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Oil Change Service</DialogTitle>
            <DialogDescription>
              Vehicle: {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Info */}
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-semibold text-foreground mb-3">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Brand/Model</p>
                  <p className="font-medium text-foreground">{vehicle.brand} {vehicle.model}</p>
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
                            {product.displayName || `${product.brand} ${product.viscosity} ${product.apiGrade} ${product.volume}L`} - {product.price.toLocaleString()} so'm ({product.stock} in stock)
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
                              {filter.displayName || `${filter.brandName} ${filter.partNumber}`} - {filter.price.toLocaleString()} so'm ({filter.stock} in stock)
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
                              {filter.displayName || `${filter.brandName} ${filter.partNumber}`} - {filter.price.toLocaleString()} so'm ({filter.stock} in stock)
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
                                  {filter.displayName || `${filter.brandName} ${filter.partNumber}`} - {filter.price.toLocaleString()} so'm ({filter.stock} in stock)
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
                        {emp.commissionRate > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {emp.commissionRate}% commission
                          </Badge>
                        )}
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
                      <p className="text-[10px]">{vehicle.brand} {vehicle.model}</p>
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
            {vehicle.brand} {vehicle.model}
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
    </div>
  )
}
