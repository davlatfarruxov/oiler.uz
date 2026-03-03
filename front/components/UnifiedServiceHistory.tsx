'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Printer, Trash2, History, Edit } from 'lucide-react'
import { getVehicleHistory, UnifiedHistoryItem } from '@/lib/api/vehicles'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/dateFormat'

interface UnifiedServiceHistoryProps {
  vehicleId: string
  onEdit: (id: string, type: 'oilChange' | 'service') => void
  onDelete: (id: string, type: 'oilChange' | 'service') => void
  onPrint: (id: string, type: 'oilChange' | 'service') => void
  onViewHistory: (id: string, type: 'oilChange' | 'service') => void
  onComplete?: (id: string) => void
  onRefresh?: () => void
}

export function UnifiedServiceHistory({
  vehicleId,
  onEdit,
  onDelete,
  onPrint,
  onViewHistory,
  onComplete,
  onRefresh
}: UnifiedServiceHistoryProps) {
  const [history, setHistory] = useState<UnifiedHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [vehicleId])

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      const response = await getVehicleHistory(vehicleId)
      const historyData = response.data || []
      console.log('Fetched history:', historyData)
      setHistory(Array.isArray(historyData) ? historyData : [])
    } catch (error) {
      console.error('Failed to load history:', error)
      toast.error('Xatolik', {
        description: 'Xizmatlar tarixini yuklashda xatolik yuz berdi'
      })
      setHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">To'langan</Badge>
      case 'partial':
        return <Badge variant="secondary">Qisman</Badge>
      case 'unpaid':
        return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">To'lanmagan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getServiceStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-400 dark:border-yellow-600">Faol</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-400 dark:border-green-600">Tugallangan</Badge>
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    if (type === 'oilChange') {
      return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">Moy almashtirish</Badge>
    } else {
      return <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">Ish sessiyasi</Badge>
    }
  }

  const formatOilChangeItems = (item: UnifiedHistoryItem): string[] => {
    const items: string[] = []

    console.log('Oil change item:', item) // Debug log

    if (item.oilProduct) {
      items.push(`Moy: ${item.oilProduct.displayName || item.oilProduct.brand}`)
    }
    if (item.oilFilter) {
      items.push(`Moy filteri: ${item.oilFilter.displayName || item.oilFilter.name}`)
    }
    if (item.airFilter) {
      items.push(`Havo filteri: ${item.airFilter.displayName || item.airFilter.name}`)
    }
    if (item.cabinFilter) {
      items.push(`Salon filteri: ${item.cabinFilter.displayName || item.cabinFilter.name}`)
    }
    if (item.fuelFilter) {
      items.push(`Yoqilg'i filteri: ${item.fuelFilter.displayName || item.fuelFilter.name}`)
    }

    return items
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Xizmatlar tarixi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Hali xizmatlar mavjud emas
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xizmatlar tarixi ({history.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(item.type)}
                    {item.status && getServiceStatusBadge(item.status)}
                    {getPaymentStatusBadge(item.paymentStatus)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <span>{formatDate(item.date)}</span>
                    {item.mileage && (
                      <span className="ml-3">• {item.mileage.toLocaleString()} km</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  {item.status === 'active' && onComplete && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onComplete(item.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Tugatish
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item.id, item.type)}
                    title="Tahrirlash"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPrint(item.id, item.type)}
                    title="Chop etish"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewHistory(item.id, item.type)}
                    title="Tarix"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id, item.type)}
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Oil Change Items */}
              {item.type === 'oilChange' && (
                <>
                  <div className="space-y-1 mb-3">
                    {formatOilChangeItems(item).length > 0 ? (
                      formatOilChangeItems(item).map((itemText, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {itemText}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Ma'lumot topilmadi
                      </div>
                    )}
                  </div>

                  {/* Employees */}
                  {item.employees && item.employees.length > 0 && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Xodimlar: {item.employees.map(e => e.name).join(', ')}
                    </div>
                  )}
                </>
              )}

              {/* Work Session Services Table */}
              {item.type === 'service' && item.services && item.services.length > 0 && (
                <div className="mb-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-semibold">Xizmat</th>
                          <th className="text-left p-2 font-semibold">Mahsulotlar</th>
                          <th className="text-left p-2 font-semibold">Xodimlar</th>
                          <th className="text-right p-2 font-semibold">Narx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.services.map((service: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="p-2 align-top">
                              <div className="font-medium">{service.serviceName}</div>
                              {service.laborCost > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Ish haqi: {service.laborCost.toLocaleString()} so'm
                                </div>
                              )}
                            </td>
                            <td className="p-2 align-top">
                              {service.items && service.items.length > 0 ? (
                                <div className="space-y-1">
                                  {service.items.map((item: any, itemIdx: number) => (
                                    <div key={itemIdx} className="text-xs text-muted-foreground">
                                      • {item.itemName} ({item.quantity} x {item.unitPrice.toLocaleString()} so'm)
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-2 align-top">
                              {service.employees && service.employees.length > 0 ? (
                                <div className="text-xs text-muted-foreground">
                                  {service.employees.map((emp: any) => emp.name).join(', ')}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-2 align-top text-right font-medium">
                              {service.totalPrice.toLocaleString()} so'm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div className="text-sm text-muted-foreground italic mb-2">
                  Izoh: {item.notes}
                </div>
              )}

              {/* Price and Payment Info */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Jami: </span>
                    <span className="font-semibold">{(item.price || 0).toLocaleString()} so'm</span>
                  </div>
                  {item.amountDue > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Qarz: </span>
                      <span className="font-semibold text-red-600 dark:text-red-500">
                        {(item.amountDue || 0).toLocaleString()} so'm
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
