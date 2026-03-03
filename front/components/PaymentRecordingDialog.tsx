'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import api from '@/lib/api/axios'
import { toast } from 'sonner'

interface PaymentRecordingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  customerName: string
  totalDebt: number
  unpaidServices: Array<{
    _id: string
    mileage?: number
    amountDue: number
    createdAt: string
    serviceType?: 'oilChange' | 'service' // Add service type
    serviceName?: string // For general services
  }>
  onPaymentRecorded?: () => void
}

export function PaymentRecordingDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  totalDebt,
  unpaidServices,
  onPaymentRecorded
}: PaymentRecordingDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  // Format number with spaces
  const formatNumberWithSpaces = (value: string): string => {
    const numericValue = value.replace(/\s/g, '')
    if (!numericValue) return ''
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const removeSpaces = (value: string): string => {
    return value.replace(/\s/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedServiceId) {
      setError('Iltimos, xizmatni tanlang')
      toast.error('Xatolik', {
        description: 'Iltimos, xizmatni tanlang'
      })
      return
    }

    if (!amount || Number(removeSpaces(amount)) <= 0) {
      setError('Iltimos, to\'lov summasini kiriting')
      toast.error('Xatolik', {
        description: 'Iltimos, to\'lov summasini kiriting'
      })
      return
    }

    const selectedService = unpaidServices.find(s => s._id === selectedServiceId)
    if (!selectedService) {
      setError('Xizmat topilmadi')
      toast.error('Xatolik', {
        description: 'Xizmat topilmadi'
      })
      return
    }

    const paymentAmount = Number(removeSpaces(amount))
    if (paymentAmount > selectedService.amountDue) {
      const errorMsg = `To'lov summasi qarz summasidan oshib ketmasligi kerak (${(selectedService.amountDue || 0).toLocaleString()} so'm)`
      setError(errorMsg)
      toast.error('Xatolik', {
        description: errorMsg
      })
      return
    }

    try {
      setIsSubmitting(true)

      await api.post('/payments', {
        customerId,
        serviceType: selectedService.serviceType || 'oilChange',
        oilChangeId: selectedService.serviceType === 'oilChange' || !selectedService.serviceType ? selectedServiceId : undefined,
        serviceId: selectedService.serviceType === 'service' ? selectedServiceId : undefined,
        amount: paymentAmount,
        paymentMethod,
        notes: notes.trim() || undefined
      })

      // Show success notification
      toast.success('To\'lov muvaffaqiyatli saqlandi!', {
        description: `${paymentAmount.toLocaleString()} so'm to'lov qabul qilindi`
      })

      // Reset form
      setSelectedServiceId('')
      setAmount('')
      setPaymentMethod('cash')
      setNotes('')
      
      // Close dialog and notify parent
      onOpenChange(false)
      if (onPaymentRecorded) {
        onPaymentRecorded()
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'To\'lovni saqlashda xatolik yuz berdi'
      setError(errorMsg)
      toast.error('Xatolik', {
        description: errorMsg
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedService = unpaidServices.find(s => s._id === selectedServiceId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>To'lov qabul qilish</DialogTitle>
          <DialogDescription>
            Mijoz: {customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Total Debt Display */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jami qarz:</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-500">
                {totalDebt.toLocaleString()} so'm
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">To'lanmagan xizmatlar:</span>
              <span className="text-sm font-semibold">{unpaidServices.length} ta</span>
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <Label htmlFor="service">Xizmat *</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Xizmatni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {unpaidServices.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    To'lanmagan xizmatlar yo'q
                  </div>
                ) : (
                  unpaidServices.map((service) => (
                    <SelectItem key={service._id} value={service._id}>
                      {service.serviceType === 'service' && service.serviceName 
                        ? `${service.serviceName} - `
                        : ''
                      }
                      {new Date(service.createdAt).toLocaleDateString('uz-UZ')}
                      {service.mileage ? ` - ${service.mileage.toLocaleString()} km` : ''} - 
                      Qarz: {(service.amountDue || 0).toLocaleString()} so'm
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Service Info */}
          {selectedService && (
            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-600 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Tanlangan xizmat:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedService.createdAt).toLocaleDateString('uz-UZ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Qarz summasi:</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-500">
                  {(selectedService.amountDue || 0).toLocaleString()} so'm
                </span>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <Label htmlFor="amount">To'lov summasi (so'm) *</Label>
            <Input
              id="amount"
              type="text"
              placeholder="100 000"
              value={formatNumberWithSpaces(amount)}
              onChange={(e) => {
                const numericValue = removeSpaces(e.target.value)
                if (/^\d*$/.test(numericValue)) {
                  setAmount(numericValue)
                }
              }}
              required
            />
            {selectedService && amount && Number(removeSpaces(amount)) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Qolgan qarz: {(selectedService.amountDue - Number(removeSpaces(amount))).toLocaleString()} so'm
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="paymentMethod">To'lov usuli *</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Naqd pul</SelectItem>
                <SelectItem value="card">Karta</SelectItem>
                <SelectItem value="transfer">Bank o'tkazmasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
            <Textarea
              id="notes"
              placeholder="Qo'shimcha ma'lumot..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                'To\'lovni saqlash'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
