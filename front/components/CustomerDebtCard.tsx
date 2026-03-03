'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, DollarSign, Calendar, TrendingUp } from 'lucide-react'

interface CustomerDebtCardProps {
  totalDebt: number
  unpaidServices: number
  overdueServices: number
  lastPaymentDate?: string
  onViewHistory?: () => void
  onRecordPayment?: () => void
}

export function CustomerDebtCard({
  totalDebt,
  unpaidServices,
  overdueServices,
  lastPaymentDate,
  onViewHistory,
  onRecordPayment
}: CustomerDebtCardProps) {
  const hasDebt = totalDebt > 0
  const hasOverdue = overdueServices > 0

  return (
    <Card className={hasOverdue ? 'border-orange-500' : hasDebt ? 'border-yellow-500' : 'border-green-500'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Qarz holati</CardTitle>
        <DollarSign className={`h-4 w-4 ${hasDebt ? 'text-orange-600 dark:text-orange-500' : 'text-green-600 dark:text-green-500'}`} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Debt */}
          <div>
            <div className="text-2xl font-bold text-foreground">
              {totalDebt.toLocaleString()} so'm
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jami qarz
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">To'lanmagan</span>
              </div>
              <div className="text-lg font-semibold mt-1">
                {unpaidServices}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                <span className="text-sm text-muted-foreground">Muddati o'tgan</span>
              </div>
              <div className="text-lg font-semibold mt-1 text-orange-600 dark:text-orange-500">
                {overdueServices}
              </div>
            </div>
          </div>

          {/* Last Payment */}
          {lastPaymentDate && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Oxirgi to'lov:</span>
              </div>
              <div className="text-sm font-medium mt-1">
                {new Date(lastPaymentDate).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="pt-4 border-t">
            <Badge 
              variant={hasOverdue ? 'destructive' : hasDebt ? 'secondary' : 'default'}
              className="w-full justify-center"
            >
              {hasOverdue ? 'Muddati o\'tgan qarzlar bor' : 
               hasDebt ? 'Qarz mavjud' : 
               'Qarz yo\'q'}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {onViewHistory && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewHistory}
                className="flex-1"
              >
                Tarix
              </Button>
            )}
            {onRecordPayment && hasDebt && (
              <Button 
                size="sm" 
                onClick={onRecordPayment}
                className="flex-1"
              >
                To'lov qilish
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
