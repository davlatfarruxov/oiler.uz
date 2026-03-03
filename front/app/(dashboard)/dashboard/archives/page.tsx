'use client'

import React, { useState, useEffect } from 'react'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Archive, Car, Droplet, Loader2, Eye, Calendar, User, RotateCcw, Users, History, ChevronDown, ChevronUp } from 'lucide-react'

interface ArchivedVehicle {
  _id: string
  plateNumber: string
  brand: string
  vehicleModel: string
  engineType: string
  customer: {
    name: string
    phone: string
  }
  isArchived: boolean
  archivedAt: string
  archivedBy: {
    name: string
    email: string
  }
}

interface ArchivedOilChange {
  _id: string
  vehicle: {
    plateNumber: string
    brand: string
    vehicleModel: string
  }
  customer: {
    name: string
    phone: string
  }
  price: number
  createdAt: string
  isArchived: boolean
  archivedAt: string
  archivedBy: {
    name: string
    email: string
  }
}

interface ArchivedEmployee {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  commissionRate: number
  isArchived: boolean
  archivedAt: string
  archivedBy: {
    name: string
    email: string
  }
}

export default function ArchivesPage() {
  const [vehicles, setVehicles] = useState<ArchivedVehicle[]>([])
  const [oilChanges, setOilChanges] = useState<ArchivedOilChange[]>([])
  const [employees, setEmployees] = useState<ArchivedEmployee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeVehiclePlates, setActiveVehiclePlates] = useState<Set<string>>(new Set())
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set())
  const [vehicleServices, setVehicleServices] = useState<Record<string, any[]>>({})

  useEffect(() => {
    fetchArchives()
  }, [])

  const fetchArchives = async () => {
    try {
      setIsLoading(true)
      
      // Fetch archived vehicles
      const vehiclesResponse = await api.get('/vehicles/archived')
      
      // Fetch archived oil changes
      const oilChangesResponse = await api.get('/oil-changes/archived')
      
      // Fetch archived employees
      const employeesResponse = await api.get('/employees/archived')
      
      // Fetch active vehicles to check plate numbers
      const activeVehiclesResponse = await api.get('/vehicles', { params: { limit: 1000 } })
      const activePlates = new Set<string>(
        (activeVehiclesResponse.data.data || []).map((v: any) => v.plateNumber)
      )
      
      console.log('Archived vehicles:', vehiclesResponse.data)
      console.log('Archived oil changes:', oilChangesResponse.data)
      console.log('Archived employees:', employeesResponse.data)
      console.log('Active vehicle plates:', activePlates)
      
      setVehicles(vehiclesResponse.data.data || [])
      setOilChanges(oilChangesResponse.data.data || [])
      setEmployees(employeesResponse.data.data || [])
      setActiveVehiclePlates(activePlates)
    } catch (error) {
      console.error('Failed to fetch archives:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (type: 'vehicle' | 'oilChange' | 'employee', id: string) => {
    if (!confirm('Ushbu elementni tiklashni xohlaysizmi?')) return

    try {
      if (type === 'vehicle') {
        await api.post(`/vehicles/${id}/restore`)
        alert('Mashina muvaffaqiyatli tiklandi')
      } else if (type === 'oilChange') {
        await api.post(`/oil-changes/${id}/restore`)
        alert('Xizmat muvaffaqiyatli tiklandi')
      } else {
        await api.post(`/employees/${id}/restore`)
        alert('Xodim muvaffaqiyatli tiklandi')
      }
      fetchArchives()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Elementni tiklashda xatolik')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const viewDetails = (item: any, type: string) => {
    setSelectedItem({ ...item, type })
    setDetailsOpen(true)
  }

  const viewHistory = async (type: 'Vehicle' | 'OilChange', id: string) => {
    try {
      setLoadingHistory(true)
      setHistoryOpen(true)
      
      let response
      if (type === 'Vehicle') {
        response = await api.get(`/vehicles/${id}/archive-history`)
      } else {
        response = await api.get(`/oil-changes/${id}/archive-history`)
      }
      
      console.log('History data:', response.data)
      setHistoryData(response.data.data || [])
    } catch (error) {
      console.error('Failed to load history:', error)
      alert('Tarixni yuklashda xatolik')
    } finally {
      setLoadingHistory(false)
    }
  }

  const toggleVehicleDetails = async (vehicleId: string) => {
    const newExpanded = new Set(expandedVehicles)
    
    if (newExpanded.has(vehicleId)) {
      newExpanded.delete(vehicleId)
    } else {
      newExpanded.add(vehicleId)
      
      // Load services if not already loaded
      if (!vehicleServices[vehicleId]) {
        try {
          const response = await api.get(`/vehicles/${vehicleId}/history`)
          setVehicleServices(prev => ({
            ...prev,
            [vehicleId]: response.data.data.oilChanges || []
          }))
        } catch (error) {
          console.error('Failed to load vehicle services:', error)
        }
      }
    }
    
    setExpandedVehicles(newExpanded)
  }

  const filteredVehicles = selectedType === 'all' || selectedType === 'Vehicle' ? vehicles : []
  const filteredOilChanges = selectedType === 'all' || selectedType === 'OilChange' ? oilChanges : []
  const filteredEmployees = selectedType === 'all' || selectedType === 'Employee' ? employees : []
  const totalArchived = vehicles.length + oilChanges.length + employees.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Arxiv</h1>
          <p className="text-muted-foreground mt-1">Arxivlangan mashinalar va xizmatlarni ko'rish va tiklash</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Jami arxivlangan elementlar</p>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground mt-2">{totalArchived}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vehicles.length} mashina, {oilChanges.length} xizmat, {employees.length} xodim
                  </p>
                </>
              )}
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-950/50 rounded-lg">
              <Archive className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Arxivlangan elementlar</CardTitle>
              <CardDescription>Barcha arxivlangan mashinalar va xizmatlar</CardDescription>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tur bo'yicha filtr" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                <SelectItem value="Vehicle">Mashinalar</SelectItem>
                <SelectItem value="OilChange">Xizmatlar</SelectItem>
                <SelectItem value="Employee">Xodimlar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : totalArchived === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Arxivlangan elementlar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Archived Vehicles */}
              {filteredVehicles.map((vehicle) => {
                const isDeleted = vehicle.plateNumber.includes('_DELETED_')
                const originalPlateNumber = isDeleted 
                  ? vehicle.plateNumber.split('_DELETED_')[0] 
                  : vehicle.plateNumber
                const canRestore = !isDeleted && !activeVehiclePlates.has(vehicle.plateNumber)
                
                return (
                  <div
                    key={vehicle._id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-muted rounded-lg mt-1">
                          <Car className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">
                              {originalPlateNumber}
                            </span>
                            <Badge className="bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                              Mashina
                            </Badge>
                            {isDeleted && (
                              <Badge className="bg-red-100 dark:bg-red-950/50 text-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
                                Raqam qayta ishlatilgan
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.brand} {vehicle.vehicleModel} - {vehicle.customer.name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(vehicle.archivedAt)}
                            </div>
                            {vehicle.archivedBy && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {vehicle.archivedBy.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVehicleDetails(vehicle._id)}
                          className="gap-2"
                        >
                          {expandedVehicles.has(vehicle._id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          Xizmatlar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewHistory('Vehicle', vehicle._id)}
                          className="gap-2"
                        >
                          <History className="w-4 h-4" />
                          Ta'rix
                        </Button>
                        {!canRestore ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            className="gap-2"
                            title={isDeleted ? "Tiklash mumkin emas - raqam qayta ishlatilgan" : "Tiklash mumkin emas - raqam band"}
                          >
                            <RotateCcw className="w-4 h-4" />
                            {isDeleted ? "Qayta ishlatilgan" : "Raqam band"}
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRestore('vehicle', vehicle._id)}
                            className="gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Tiklash
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Services Section */}
                    {expandedVehicles.has(vehicle._id) && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold text-foreground mb-3">
                          Xizmatlar tarixi ({vehicleServices[vehicle._id]?.length || 0})
                        </h4>
                        {!vehicleServices[vehicle._id] ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : vehicleServices[vehicle._id].length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Xizmatlar topilmadi
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {vehicleServices[vehicle._id].map((service: any) => (
                              <div key={service._id} className="bg-muted/30 rounded-lg p-3 text-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="font-semibold">
                                      {new Date(service.createdAt).toLocaleDateString('en-GB')}
                                    </span>
                                    {service.isArchived && (
                                      <Badge className="bg-orange-100 dark:bg-orange-950/50 text-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800 text-xs">
                                        Arxivlangan
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="font-bold text-foreground">
                                    {service.price?.toLocaleString()} so'm
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  <div>
                                    <span className="font-medium">Moy:</span>{' '}
                                    {service.oilProductCustomerProvided 
                                      ? `Egasi keltirgan (${service.oilProductCustomerProvidedDetails || 'N/A'})`
                                      : service.oilProduct 
                                        ? `${service.oilProduct.brand?.name || service.oilProduct.brand} ${service.oilProduct.viscosity} ${service.oilProduct.apiGrade}`
                                        : 'N/A'
                                    }
                                  </div>
                                  <div>
                                    <span className="font-medium">Miqdor:</span> {service.oilQuantityUsed || 0}L
                                  </div>
                                  <div>
                                    <span className="font-medium">Probeg:</span> {service.mileage?.toLocaleString() || 'N/A'} km
                                  </div>
                                  <div>
                                    <span className="font-medium">Keyingi:</span> {service.nextServiceMileage?.toLocaleString() || 'N/A'} km
                                  </div>
                                </div>
                                
                                {(service.oilFilter || service.airFilter || service.cabinFilter || service.fuelFilter) && (
                                  <div className="mt-2 pt-2 border-t border-border/50">
                                    <span className="text-xs font-medium text-muted-foreground">Filterlar: </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {service.oilFilter && (
                                        <Badge variant="outline" className="text-xs">
                                          Moy: {service.oilFilter.brandName || service.oilFilter.brand} {service.oilFilter.partNumber}
                                        </Badge>
                                      )}
                                      {service.airFilter && (
                                        <Badge variant="outline" className="text-xs">
                                          Havo: {service.airFilter.brandName || service.airFilter.brand} {service.airFilter.partNumber}
                                        </Badge>
                                      )}
                                      {service.cabinFilter && (
                                        <Badge variant="outline" className="text-xs">
                                          Salon: {service.cabinFilter.brandName || service.cabinFilter.brand} {service.cabinFilter.partNumber}
                                        </Badge>
                                      )}
                                      {service.fuelFilter && (
                                        <Badge variant="outline" className="text-xs">
                                          Yoqilg'i: {service.fuelFilter.brandName || service.fuelFilter.brand} {service.fuelFilter.partNumber}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {service.employees && service.employees.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-border/50">
                                    <span className="text-xs font-medium text-muted-foreground">Xodimlar: </span>
                                    <span className="text-xs text-foreground">
                                      {service.employees.map((e: any) => e.name).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Archived Oil Changes */}
              {filteredOilChanges.map((oilChange) => (
                <div
                  key={oilChange._id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-muted rounded-lg mt-1">
                        <Droplet className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {oilChange.vehicle?.plateNumber || 'Noma\'lum mashina'}
                          </span>
                          <Badge className="bg-green-100 dark:bg-green-950/50 text-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                            Xizmat
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {oilChange.vehicle?.brand} {oilChange.vehicle?.vehicleModel} - {oilChange.price?.toLocaleString()} so'm
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(oilChange.archivedAt)}
                          </div>
                          {oilChange.archivedBy && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {oilChange.archivedBy.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewHistory('OilChange', oilChange._id)}
                        className="gap-2"
                      >
                        <History className="w-4 h-4" />
                        Ta'rix
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRestore('oilChange', oilChange._id)}
                        className="gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Tiklash
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Archived Employees */}
              {filteredEmployees.map((employee) => (
                <div
                  key={employee._id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-muted rounded-lg mt-1">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {employee.name}
                          </span>
                          <Badge className="bg-purple-100 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800">
                            Xodim
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {employee.email} - {employee.phone}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(employee.archivedAt)}
                          </div>
                          {employee.archivedBy && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {employee.archivedBy.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDetails(employee, 'Employee')}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Tafsilotlar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRestore('employee', employee._id)}
                        className="gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Tiklash
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Arxiv tafsilotlari</DialogTitle>
            <DialogDescription>
              Ushbu arxivlangan element haqida to'liq ma'lumot
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded p-3">
                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                  {JSON.stringify(selectedItem, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ta'rix</DialogTitle>
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
                              ? 'bg-green-100 dark:bg-green-950/50 text-green-900 dark:text-green-200 border-green-200 dark:border-green-800'
                              : entry.action === 'updated'
                              ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                              : 'bg-orange-100 dark:bg-orange-950/50 text-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800'
                          }
                        >
                          {entry.action === 'created' ? 'Yaratildi' : entry.action === 'updated' ? 'O\'zgartirildi' : 'Arxivlandi'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(entry.performedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{entry.performedBy?.name || 'Noma\'lum'}</span>
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
                              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded p-2">
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
                              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded p-2">
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
    </div>
  )
}
