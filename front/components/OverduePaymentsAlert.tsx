'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Calendar, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OverdueService {
  _id: string
  vehicle: {
    _id: string
    plateNumber: string
    brand: string
    vehicleModel: string
  }
  customer: {
    _id: string
    name: string
    phone: string
  }
  amountDue: number
  dueDate: string
  createdAt: string
  mileage: number
}

interface OverduePaymentsAlertProps {
  overdueServices: OverdueService[]
  totalOverdueAmount: number
}

export function OverduePaymentsAlert({ overdueServices, totalOverdueAmount }: OverduePaymentsAlertProps) {
  const router = useRouter()

  if (overdueServices.length === 0) {
    return null
  }

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
          <CardTitle className="text-red-700 dark:text-red-400">Muddati o'tgan to'lovlar</CardTitle>
        </div>
        <CardDescription className="text-red-600 dark:text-red-500">
          {overdueServices.length} ta xizmat uchun to'lov muddati o'tgan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Overdue Amount */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-400 dark:border-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600 dark:text-red-500" />
                <span className="text-sm font-medium">Jami muddati o'tgan qarz:</span>
              </div>
              <span className="text-xl font-bold text-red-600 dark:text-red-500">
                {totalOverdueAmount.toLocaleString()} so'm
              </span>
            </div>
          </div>

          {/* Overdue Services List */}
          <div className="space-y-3">
            {overdueServices.slice(0, 5).map((service) => {
              const daysOverdue = getDaysOverdue(service.dueDate)
              return (
                <div
                  key={service._id}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-300 dark:border-red-700 hover:border-red-500 dark:hover:border-red-500 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/service/${service.vehicle._id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">
                          {service.vehicle.plateNumber}
                        </p>
                        <Badge variant="destructive" className="text-xs bg-red-600 hover:bg-red-700">
                          {daysOverdue} kun kechikkan
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {service.customer.name} • {service.customer.phone}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Muddat: {new Date(service.dueDate).toLocaleDateString('uz-UZ')}</span>
                        </div>
                        <span>•</span>
                        <span>{service.mileage ? service.mileage.toLocaleString() : '0'} km</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600 dark:text-red-500">
                        {(service.amountDue || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">so'm</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Show More Button */}
          {overdueServices.length > 5 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // TODO: Navigate to full overdue payments page
                alert('Barcha muddati o\'tgan to\'lovlar sahifasi tez orada qo\'shiladi')
              }}
            >
              Barchasini ko'rish ({overdueServices.length - 5} ta ko'proq)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
