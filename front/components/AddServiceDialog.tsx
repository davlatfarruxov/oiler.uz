'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, X, Trash2 } from 'lucide-react'
import { PaymentStatusSelector } from '@/components/PaymentStatusSelector'
import api from '@/lib/api/axios'
import { toast } from 'sonner'
import { EmployeeCommissionControl } from '@/components/EmployeeCommissionControl'

interface AddServiceDialogProps {
  open: boolean
  onClose: () => void
  vehicleId: string
  customerId: string
  onSuccess: () => void
}

interface ServiceItemForm {
  itemName: string
  itemType: 'inventory' | 'custom'
  inventoryId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface ServiceForm {
  serviceName: string
  items: ServiceItemForm[]
  laborCost: number
  employees: string[]
  employeeCommissions?: any[]
}

interface WorkSessionFormData {
  services: ServiceForm[]
  mileage?: number
  notes?: string
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  amountPaid: number
  dueDate: string
}

export function AddServiceDialog({
  open,
  onClose,
  vehicleId,
  customerId,
  onSuccess
}: AddServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Calculate default due date once
  const getDefaultDueDate = () => {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<WorkSessionFormData>({
    services: [{
      serviceName: '',
      items: [],
      laborCost: 0,
      employees: [],
      employeeCommissions: []
    }],
    mileage: undefined,
    notes: '',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    dueDate: ''
  })

  useEffect(() => {
    if (open) {
      fetchFormData()
      // Set due date when dialog opens
      setFormData(prev => ({
        ...prev,
        dueDate: getDefaultDueDate()
      }))
    }
  }, [open])

  const fetchFormData = async () => {
    try {
      setLoadingData(true)
      const [inventoryRes, employeesRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/employees')
      ])

      setInventory(inventoryRes.data.data || [])
      setEmployees(employeesRes.data.data?.filter((e: any) => e.active) || [])
    } catch (error) {
      console.error('Failed to load form data:', error)
      toast.error('Xatolik', {
        description: 'Ma\'lumotlarni yuklashda xatolik yuz berdi'
      })
    } finally {
      setLoadingData(false)
    }
  }

  // Add new service (copy employees from first service as default)
  const addService = () => {
    const defaultEmployees = formData.services.length > 0 ? formData.services[0].employees : []
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        {
          serviceName: '',
          items: [],
          laborCost: 0,
          employees: [...defaultEmployees], // Copy employees from first service
          employeeCommissions: []
        }
      ]
    })
  }

  // Remove service
  const removeService = (serviceIndex: number) => {
    if (formData.services.length === 1) {
      toast.error('Xatolik', { description: 'Kamida bitta xizmat bo\'lishi kerak' })
      return
    }
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== serviceIndex)
    })
  }

  // Update service
  const updateService = (serviceIndex: number, updates: Partial<ServiceForm>) => {
    const newServices = [...formData.services]
    newServices[serviceIndex] = { ...newServices[serviceIndex], ...updates }
    setFormData({ ...formData, services: newServices })
  }

  // Add item to service
  const addServiceItem = (serviceIndex: number) => {
    const newServices = [...formData.services]
    newServices[serviceIndex].items.push({
      itemName: '',
      itemType: 'custom',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    })
    setFormData({ ...formData, services: newServices })
  }

  // Remove item from service
  const removeServiceItem = (serviceIndex: number, itemIndex: number) => {
    const newServices = [...formData.services]
    newServices[serviceIndex].items = newServices[serviceIndex].items.filter((_, i) => i !== itemIndex)
    setFormData({ ...formData, services: newServices })
  }

  // Update service item
  const updateServiceItem = (serviceIndex: number, itemIndex: number, updates: Partial<ServiceItemForm>) => {
    const newServices = [...formData.services]
    newServices[serviceIndex].items[itemIndex] = {
      ...newServices[serviceIndex].items[itemIndex],
      ...updates
    }
    
    // Recalculate total price for this item
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      const item = newServices[serviceIndex].items[itemIndex]
      item.totalPrice = item.quantity * item.unitPrice
    }
    
    setFormData({ ...formData, services: newServices })
  }

  // Handle inventory select
  const handleInventorySelect = (serviceIndex: number, itemIndex: number, inventoryId: string) => {
    const item = inventory.find(i => i._id === inventoryId)
    if (item) {
      updateServiceItem(serviceIndex, itemIndex, {
        inventoryId,
        itemName: item.name,
        unitPrice: item.price,
        totalPrice: formData.services[serviceIndex].items[itemIndex].quantity * item.price
      })
    }
  }

  // Toggle item type
  const toggleItemType = (serviceIndex: number, itemIndex: number, useInventory: boolean) => {
    if (useInventory) {
      updateServiceItem(serviceIndex, itemIndex, {
        itemType: 'inventory',
        inventoryId: '',
        itemName: '',
        unitPrice: 0,
        totalPrice: 0
      })
    } else {
      updateServiceItem(serviceIndex, itemIndex, {
        itemType: 'custom',
        inventoryId: undefined,
        itemName: '',
        unitPrice: 0,
        totalPrice: 0
      })
    }
  }

  // Calculate service total
  const calculateServiceTotal = (service: ServiceForm) => {
    const itemsTotal = service.items.reduce((sum, item) => sum + item.totalPrice, 0)
    return itemsTotal + service.laborCost
  }

  // Calculate grand total
  const calculateGrandTotal = () => {
    return formData.services.reduce((sum, service) => sum + calculateServiceTotal(service), 0)
  }

  // Handle employee commission change for a specific service
  const handleEmployeeCommissionsChange = (serviceIndex: number, commissions: any[]) => {
    const newServices = [...formData.services]
    newServices[serviceIndex].employeeCommissions = commissions
    setFormData({ ...formData, services: newServices })
  }
  const handleEmployeeToggle = (serviceIndex: number, employeeId: string, checked: boolean) => {
    const newServices = [...formData.services]
    if (checked) {
      newServices[serviceIndex].employees = [...newServices[serviceIndex].employees, employeeId]
    } else {
      newServices[serviceIndex].employees = newServices[serviceIndex].employees.filter(id => id !== employeeId)
    }
    setFormData({ ...formData, services: newServices })
  }

  // Format number with spaces
  const formatNumberWithSpaces = (value: string): string => {
    const numericValue = value.replace(/\s/g, '')
    if (!numericValue) return ''
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Remove spaces
  const removeSpaces = (value: string): string => {
    return value.replace(/\s/g, '')
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.services.length === 0) {
      toast.error('Xatolik', { description: 'Kamida bitta xizmat qo\'shing' })
      return
    }

    for (const service of formData.services) {
      if (!service.serviceName.trim()) {
        toast.error('Xatolik', { description: 'Barcha xizmatlar nomini kiriting' })
        return
      }

      if (service.items.length === 0 && service.laborCost === 0) {
        toast.error('Xatolik', { description: `"${service.serviceName}" xizmati uchun kamida bitta mahsulot yoki ish haqi kiriting` })
        return
      }

      for (const item of service.items) {
        if (!item.itemName.trim()) {
          toast.error('Xatolik', { description: 'Barcha mahsulotlar nomini kiriting' })
          return
        }
        if (item.quantity <= 0) {
          toast.error('Xatolik', { description: 'Miqdor 0 dan katta bo\'lishi kerak' })
          return
        }
        if (item.unitPrice < 0) {
          toast.error('Xatolik', { description: 'Narx manfiy bo\'lishi mumkin emas' })
          return
        }
        if (item.itemType === 'inventory' && !item.inventoryId) {
          toast.error('Xatolik', { description: 'Inventardan mahsulot tanlang' })
          return
        }
      }

      if (service.employees.length === 0) {
        toast.error('Xatolik', { description: `"${service.serviceName}" xizmati uchun kamida bitta xodimni tanlang` })
        return
      }
    }

    try {
      setIsSubmitting(true)

      const grandTotal = calculateGrandTotal()

      const payload = {
        vehicleId,
        customerId,
        services: formData.services,
        mileage: formData.mileage,
        notes: formData.notes?.trim() || undefined,
        paymentStatus: formData.paymentStatus,
        amountPaid: formData.paymentStatus === 'paid' ? grandTotal :
                    formData.paymentStatus === 'partial' ? formData.amountPaid : 0,
        dueDate: formData.dueDate
      }

      console.log('Sending payload:', JSON.stringify(payload, null, 2))

      await api.post('/services', payload)

      toast.success('Muvaffaqiyat!', {
        description: 'Ish sessiyasi muvaffaqiyatli saqlandi'
      })

      // Reset form
      setFormData({
        services: [{
          serviceName: '',
          items: [],
          laborCost: 0,
          employees: [],
          employeeCommissions: []
        }],
        mileage: undefined,
        notes: '',
        paymentStatus: 'unpaid',
        amountPaid: 0,
        dueDate: getDefaultDueDate()
      })

      onClose()
      onSuccess()
    } catch (error: any) {
      toast.error('Xatolik', {
        description: error.response?.data?.message || 'Xizmatni saqlashda xatolik yuz berdi'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const grandTotal = calculateGrandTotal()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yangi ish sessiyasi</DialogTitle>
          <DialogDescription>
            Bir nechta xizmatlarni birgalikda qo'shing
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Services Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Xizmatlar</Label>
                <Button type="button" variant="outline" size="sm" onClick={addService}>
                  <Plus className="w-4 h-4 mr-2" />
                  Xizmat qo'shish
                </Button>
              </div>

              {formData.services.map((service, serviceIndex) => (
                <div key={serviceIndex} className="border-2 rounded-lg p-4 space-y-4 bg-accent/5">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Xizmat #{serviceIndex + 1}</Label>
                    {formData.services.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(serviceIndex)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {/* Service Name */}
                  <div>
                    <Label>Xizmat nomi *</Label>
                    <Input
                      placeholder="Masalan: Tormoz ta'mirlash"
                      value={service.serviceName}
                      onChange={(e) => updateService(serviceIndex, { serviceName: e.target.value })}
                      required
                    />
                  </div>

                  {/* Service Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Mahsulotlar</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addServiceItem(serviceIndex)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Mahsulot
                      </Button>
                    </div>

                    {service.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="border rounded-lg p-3 space-y-3 bg-background">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`inventory-${serviceIndex}-${itemIndex}`}
                              checked={item.itemType === 'inventory'}
                              onCheckedChange={(checked) => toggleItemType(serviceIndex, itemIndex, checked as boolean)}
                            />
                            <Label htmlFor={`inventory-${serviceIndex}-${itemIndex}`} className="cursor-pointer text-sm">
                              Inventardan
                            </Label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeServiceItem(serviceIndex, itemIndex)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {item.itemType === 'inventory' ? (
                            <div>
                              <Label className="text-sm">Mahsulot *</Label>
                              <Select
                                value={item.inventoryId || ''}
                                onValueChange={(value) => handleInventorySelect(serviceIndex, itemIndex, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Tanlang" />
                                </SelectTrigger>
                                <SelectContent>
                                  {inventory.map((inv) => (
                                    <SelectItem key={inv._id} value={inv._id}>
                                      {inv.name} - {(inv.price || 0).toLocaleString()} so'm
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <>
                              <div>
                                <Label className="text-sm">Nomi *</Label>
                                <Input
                                  placeholder="Mahsulot nomi"
                                  value={item.itemName}
                                  onChange={(e) => updateServiceItem(serviceIndex, itemIndex, { itemName: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Narxi *</Label>
                                <Input
                                  type="text"
                                  placeholder="50 000"
                                  value={formatNumberWithSpaces(item.unitPrice.toString())}
                                  onChange={(e) => {
                                    const numericValue = removeSpaces(e.target.value)
                                    if (/^\d*$/.test(numericValue)) {
                                      updateServiceItem(serviceIndex, itemIndex, { unitPrice: Number(numericValue) || 0 })
                                    }
                                  }}
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <Label className="text-sm">Miqdor *</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateServiceItem(serviceIndex, itemIndex, { quantity: Number(e.target.value) || 1 })}
                            />
                          </div>

                          <div>
                            <Label className="text-sm">Jami</Label>
                            <Input
                              value={formatNumberWithSpaces(item.totalPrice.toString()) + ' so\'m'}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {service.items.length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                        Mahsulot qo'shilmagan
                      </div>
                    )}
                  </div>

                  {/* Labor Cost */}
                  <div>
                    <Label>Ish haqi (so'm)</Label>
                    <Input
                      type="text"
                      placeholder="100 000"
                      value={formatNumberWithSpaces(service.laborCost.toString())}
                      onChange={(e) => {
                        const numericValue = removeSpaces(e.target.value)
                        if (/^\d*$/.test(numericValue)) {
                          updateService(serviceIndex, { laborCost: Number(numericValue) || 0 })
                        }
                      }}
                    />
                  </div>

                  {/* Service Total */}
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Xizmat jami:</span>
                      <span className="text-lg font-bold text-primary">
                        {formatNumberWithSpaces(calculateServiceTotal(service).toString())} so'm
                      </span>
                    </div>
                  </div>

                  {/* Employees for this service */}
                  <div>
                    <Label>Xodimlar *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {employees.map((employee) => (
                        <div key={employee._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`employee-${serviceIndex}-${employee._id}`}
                            checked={service.employees.includes(employee._id)}
                            onCheckedChange={(checked) => handleEmployeeToggle(serviceIndex, employee._id, checked as boolean)}
                          />
                          <Label htmlFor={`employee-${serviceIndex}-${employee._id}`} className="cursor-pointer text-sm">
                            {employee.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Employee Commission Control */}
                  <EmployeeCommissionControl
                    employees={employees}
                    selectedEmployees={service.employees}
                    totalServicePrice={calculateServiceTotal(service)}
                    laborCost={service.laborCost}
                    commissions={service.employeeCommissions || []}
                    onCommissionsChange={(commissions) => handleEmployeeCommissionsChange(serviceIndex, commissions)}
                  />
                </div>
              ))}
            </div>

            {/* Mileage */}
            <div>
              <Label htmlFor="mileage">Probeg (km)</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="50000"
                value={formData.mileage || ''}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Izohlar</Label>
              <Textarea
                id="notes"
                placeholder="Qo'shimcha ma'lumotlar..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Payment Status */}
            <PaymentStatusSelector
              paymentStatus={formData.paymentStatus}
              amountPaid={formData.amountPaid.toString()}
              totalPrice={grandTotal}
              dueDate={formData.dueDate}
              onPaymentStatusChange={(status) => setFormData({ ...formData, paymentStatus: status })}
              onAmountPaidChange={(amount) => setFormData({ ...formData, amountPaid: Number(amount) || 0 })}
              onDueDateChange={(date) => setFormData({ ...formData, dueDate: date })}
            />

            {/* Grand Total */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Umumiy jami:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatNumberWithSpaces(grandTotal.toString())} so'm
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  'Saqlash'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Bekor qilish
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
