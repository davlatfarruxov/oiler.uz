'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Check, Printer, Plus, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OilChangesPage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [printType, setPrintType] = useState<'sticker' | 'receipt'>('receipt')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form data from backend
  const [filters, setFilters] = useState<any[]>([])
  const [additionalProducts, setAdditionalProducts] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [oilChanges, setOilChanges] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    oilType: 'mineral',
    oilQuantity: '4',
    oilFilterId: '',
    additionalProducts: [] as string[],
    employeeId: '',
    mileage: '',
    notes: '',
  })

  useEffect(() => {
    fetchVehicles()
    fetchFormData()
    fetchOilChanges()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles')
      setVehicles(response.data.data)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    }
  }

  const fetchFormData = async () => {
    try {
      const [inventoryRes, employeesRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/employees')
      ])

      const inventory = inventoryRes.data.data
      setFilters(inventory.filter((i: any) => i.productType === 'filter'))
      setAdditionalProducts(inventory.filter((i: any) => i.productType === 'other'))
      setEmployees(employeesRes.data.data.filter((e: any) => e.active))
    } catch (error) {
      console.error('Failed to load form data:', error)
    }
  }

  const fetchOilChanges = async () => {
    try {
      const response = await api.get('/oil-changes')
      setOilChanges(response.data.data)
    } catch (error) {
      console.error('Failed to load oil changes:', error)
    }
  }

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setOpen(false)
  }

  const calculatePrice = () => {
    let total = 0

    // Oil price (assuming $10 per liter)
    total += Number(formData.oilQuantity || 0) * 10

    // Filter price
    const filter = filters.find(f => f._id === formData.oilFilterId)
    if (filter) total += filter.price

    // Additional products
    formData.additionalProducts.forEach(productId => {
      const product = additionalProducts.find(p => p._id === productId)
      if (product) total += product.price
    })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedVehicle || !formData.oilFilterId || !formData.mileage || !formData.employeeId) {
      alert('Please fill all required fields')
      return
    }

    try {
      setIsSaving(true)

      const oilChangeData = {
        vehicleId: selectedVehicle._id,
        customerId: selectedVehicle.customer._id,
        oilType: formData.oilType,
        oilQuantity: Number(formData.oilQuantity),
        oilFilterId: formData.oilFilterId,
        additionalProducts: formData.additionalProducts.map(productId => ({
          productId,
          quantity: 1
        })),
        mileage: Number(formData.mileage),
        price: calculatePrice()
      }

      await api.post('/oil-changes', oilChangeData)

      // Reset form
      setFormData({
        oilType: 'mineral',
        oilQuantity: '4',
        oilFilterId: '',
        additionalProducts: [],
        employeeId: '',
        mileage: '',
        notes: '',
      })
      setShowForm(false)
      setShowPrintPreview(true)
      fetchOilChanges()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to record oil change')
    } finally {
      setIsSaving(false)
    }
  }

  const totalPrice = calculatePrice()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Oil Changes</h1>
          <p className="text-muted-foreground mt-1">Manage oil change services</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Oil Change
        </Button>
      </div>

      {/* Recent Oil Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Oil Changes</CardTitle>
          <CardDescription>Latest service records</CardDescription>
        </CardHeader>
        <CardContent>
          {oilChanges.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No oil changes recorded yet</p>
          ) : (
            <div className="space-y-4">
              {oilChanges.slice(0, 10).map((service: any) => (
                <div key={service._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-foreground">
                          {service.vehicle?.plateNumber || 'N/A'}
                        </p>
                        <Badge variant="outline">{service.oilType?.replace('_', ' ').toUpperCase() || 'N/A'}</Badge>
                        <Badge variant="outline">{service.oilQuantity ? `${service.oilQuantity}L` : 'N/A'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer: {service.customer?.name || 'N/A'} • Mileage: {service.mileage} km
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Employee: {service.employee?.name || 'N/A'} • {new Date(service.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">${service.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Oil Change Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Oil Change Service</DialogTitle>
            <DialogDescription>Select vehicle and fill in service details</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Selection */}
            <div>
              <Label>Select Vehicle *</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 bg-transparent mt-2">
                    <Search className="w-4 h-4" />
                    {selectedVehicle ? `${selectedVehicle.plateNumber} - ${selectedVehicle.brand} ${selectedVehicle.vehicleModel}` : 'Search vehicle...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Enter plate number..." />
                    <CommandEmpty>No vehicle found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {vehicles.map((vehicle) => (
                          <CommandItem key={vehicle._id} onSelect={() => handleVehicleSelect(vehicle)}>
                            <Check className={cn('w-4 h-4 mr-2', selectedVehicle?._id === vehicle._id ? 'opacity-100' : 'opacity-0')} />
                            {vehicle.plateNumber} - {vehicle.brand} {vehicle.vehicleModel}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedVehicle && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Brand/Model</p>
                    <p className="font-medium text-foreground">{selectedVehicle.brand} {selectedVehicle.vehicleModel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Engine</p>
                    <p className="font-medium text-foreground capitalize">{selectedVehicle.engineType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium text-foreground">{selectedVehicle.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{selectedVehicle.customer?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Oil Selection Section */}
            <div className="border-b pb-6">
              <h3 className="font-semibold text-foreground mb-4">Oil Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="oilType">Oil Type *</Label>
                  <Select value={formData.oilType} onValueChange={(value) => setFormData({ ...formData, oilType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mineral">Mineral</SelectItem>
                      <SelectItem value="semi_synthetic">Semi Synthetic</SelectItem>
                      <SelectItem value="full_synthetic">Full Synthetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity (Liters) *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="4"
                    value={formData.oilQuantity}
                    onChange={(e) => setFormData({ ...formData, oilQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Filter Selection */}
            <div className="border-b pb-6">
              <h3 className="font-semibold text-foreground mb-4">Filter *</h3>
              <Select value={formData.oilFilterId} onValueChange={(value) => setFormData({ ...formData, oilFilterId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  {filters.map((filter) => (
                    <SelectItem key={filter._id} value={filter._id}>
                      {filter.name} - ${filter.price} ({filter.stock} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Products */}
            <div className="border-b pb-6">
              <h3 className="font-semibold text-foreground mb-4">Additional Products</h3>
              <div className="space-y-2">
                {additionalProducts.map((product) => (
                  <div key={product._id} className="flex items-center gap-2">
                    <Checkbox
                      id={`product-${product._id}`}
                      checked={formData.additionalProducts.includes(product._id)}
                      onCheckedChange={(checked) => handleAdditionalProductChange(product._id, checked as boolean)}
                    />
                    <Label htmlFor={`product-${product._id}`} className="cursor-pointer flex-1">
                      {product.name} <span className="text-muted-foreground">${product.price}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
              <div>
                <Label htmlFor="employee">Employee *</Label>
                <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mileage">Current Mileage *</Label>
                <Input
                  type="number"
                  placeholder="45000"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  required
                />
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
              <div className="flex justify-between items-center mb-4">
                <span className="text-foreground font-semibold">Total Price:</span>
                <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
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
                onClick={() => {
                  setShowForm(false)
                  setSelectedVehicle(null)
                }}
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
                  Print Sticker
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
                <div className="text-center space-y-3">
                  <h3 className="font-bold text-lg">OIL CHANGE SERVICE STICKER</h3>
                  <div className="text-sm space-y-2">
                    <p><strong>Vehicle:</strong> {selectedVehicle?.plateNumber}</p>
                    <p><strong>Oil Type:</strong> {formData.oilType.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p className="border-t pt-2"><strong>Next Service:</strong> +5000 km or 6 months</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm space-y-3">
                  <h3 className="font-bold text-lg text-center">SERVICE RECEIPT</h3>
                  <div className="border-b pb-2">
                    <p><strong>Vehicle:</strong> {selectedVehicle?.plateNumber}</p>
                    <p><strong>Customer:</strong> {selectedVehicle?.customer?.name}</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="font-semibold mb-1">Services:</p>
                    <p>Oil Change - {formData.oilType.replace('_', ' ').toUpperCase()} ({formData.oilQuantity}L)</p>
                    <p>Oil Filter - {filters.find(f => f._id === formData.oilFilterId)?.name}</p>
                    {formData.additionalProducts.map(id => (
                      <p key={id}>{additionalProducts.find(p => p._id === id)?.name}</p>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => window.print()} className="flex-1 gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button variant="outline" onClick={() => {
                setShowPrintPreview(false)
                setSelectedVehicle(null)
              }}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
