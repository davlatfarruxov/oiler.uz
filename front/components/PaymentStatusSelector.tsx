'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface PaymentStatusSelectorProps {
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  amountPaid: string
  totalPrice: number
  dueDate: string
  onPaymentStatusChange: (status: 'paid' | 'partial' | 'unpaid') => void
  onAmountPaidChange: (amount: string) => void
  onDueDateChange: (date: string) => void
}

export function PaymentStatusSelector({
  paymentStatus,
  amountPaid,
  totalPrice,
  dueDate,
  onPaymentStatusChange,
  onAmountPaidChange,
  onDueDateChange
}: PaymentStatusSelectorProps) {
  const amountDue = totalPrice - (Number(amountPaid) || 0)

  const formatNumberWithSpaces = (value: string): string => {
    const numericValue = value.replace(/\s/g, '')
    if (!numericValue) return ''
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const removeSpaces = (value: string): string => {
    return value.replace(/\s/g, '')
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-foreground">To'lov holati</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentStatus">To'lov holati *</Label>
          <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
            <SelectTrigger id="paymentStatus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">To'langan</SelectItem>
              <SelectItem value="partial">Qisman to'langan</SelectItem>
              <SelectItem value="unpaid">To'lanmagan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentStatus === 'partial' && (
          <div>
            <Label htmlFor="amountPaid">To'langan summa (so'm) *</Label>
            <Input
              id="amountPaid"
              type="text"
              placeholder="50 000"
              value={formatNumberWithSpaces(amountPaid)}
              onChange={(e) => {
                const numericValue = removeSpaces(e.target.value)
                if (/^\d*$/.test(numericValue)) {
                  onAmountPaidChange(numericValue)
                }
              }}
            />
          </div>
        )}

        <div>
          <Label htmlFor="dueDate">To'lov muddati</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: 7 kun
          </p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-secondary/30 p-3 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Jami summa:</span>
          <span className="font-medium">{totalPrice.toLocaleString()} so'm</span>
        </div>
        
        {paymentStatus !== 'unpaid' && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">To'langan:</span>
              <span className="font-medium text-green-600">
                {(paymentStatus === 'paid' ? totalPrice : Number(amountPaid) || 0).toLocaleString()} so'm
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Qarz:</span>
              <span className="font-semibold text-orange-600">
                {(paymentStatus === 'paid' ? 0 : amountDue).toLocaleString()} so'm
              </span>
            </div>
          </>
        )}

        {paymentStatus === 'unpaid' && (
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground">Qarz:</span>
            <span className="font-semibold text-red-600">
              {totalPrice.toLocaleString()} so'm
            </span>
          </div>
        )}

        <div className="pt-2">
          <Badge 
            variant={
              paymentStatus === 'paid' ? 'default' : 
              paymentStatus === 'partial' ? 'secondary' : 
              'destructive'
            }
          >
            {paymentStatus === 'paid' ? 'To\'langan' : 
             paymentStatus === 'partial' ? 'Qisman to\'langan' : 
             'To\'lanmagan'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
