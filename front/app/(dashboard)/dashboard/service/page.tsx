'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, Car, Wrench, X, History, Edit } from 'lucide-react'

interface Vehicle {
  _id: string
  plateNumber: string
  brand: string
  vehicleModel: string
  engineType: string
  customer: {
    _id: string
    name: string
    phone: string
    totalDebt?: number
  }
}

interface OilChange {
  _id: string
  vehicle: {
    plateNumber: string
    brand: string
    vehicleModel: string
  } | null
  totalCost: number
  price: number
  createdAt: string
  paymentStatus?: 'paid' | 'partial' | 'unpaid'
  amountDue?: number
  amountPaid?: number
}

export default function ServicePage() {
  const router = useRouter()
  const [plateNumber, setPlateNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null)
  
  // Recent services state
  const [recentServices, setRecentServices] = useState<OilChange[]>([])
  const [servicesPage, setServicesPage] = useState(1)
  const [servicesTotalPages, setServicesTotalPages] = useState(1)
  const [loadingServices, setLoadingServices] = useState(false)
  
  // General services state
  const [generalServices, setGeneralServices] = useState<any[]>([])
  const [generalServicesPage, setGeneralServicesPage] = useState(1)
  const [generalServicesTotalPages, setGeneralServicesTotalPages] = useState(1)
  const [loadingGeneralServices, setLoadingGeneralServices] = useState(false)
  
  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesPage, setVehiclesPage] = useState(1)
  const [vehiclesTotalPages, setVehiclesTotalPages] = useState(1)
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  // Service detail modal state
  const [selectedService, setSelectedService] = useState<any>(null)
  const [showServiceDetail, setShowServiceDetail] = useState(false)
  const [loadingServiceDetail, setLoadingServiceDetail] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load recent services
  useEffect(() => {
    loadRecentServices()
  }, [servicesPage])

  // Load general services
  useEffect(() => {
    loadGeneralServices()
  }, [generalServicesPage])

  // Load vehicles
  useEffect(() => {
    loadVehicles()
  }, [vehiclesPage])

  const loadServiceDetail = async (serviceId: string) => {
    try {
      setLoadingServiceDetail(true)
      const response = await api.get(`/oil-changes/${serviceId}`)
      console.log('Service detail response:', response.data)
      
      // Handle different response structures
      const serviceData = response.data.data || response.data
      setSelectedService(serviceData)
      setShowServiceDetail(true)
    } catch (error) {
      console.error('Failed to load service detail:', error)
      alert('Failed to load service details')
    } finally {
      setLoadingServiceDetail(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? It will be moved to archive.')) return

    try {
      await api.post(`/oil-changes/${serviceId}/archive`, {
        reason: 'Deleted from service page'
      })
      alert('Service deleted successfully')
      setShowServiceDetail(false)
      loadRecentServices() // Reload list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete service')
    }
  }

  const viewServiceHistory = async (serviceId: string) => {
    try {
      setLoadingHistory(true)
      setShowHistory(true)
      
      const response = await api.get(`/oil-changes/${serviceId}/archive-history`)
      console.log('Service history:', response.data)
      setHistoryData(response.data.data || [])
    } catch (error) {
      console.error('Failed to load history:', error)
      alert('Failed to load service history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleEditService = async (service: any) => {
    // Check if vehicle exists and is not deleted
    if (!service.vehicle?._id) {
      alert('Vehicle information not available')
      return
    }

    try {
      // Check if vehicle still exists and is not archived/deleted
      const vehicleResponse = await api.get(`/vehicles/${service.vehicle._id}`)
      const vehicle = vehicleResponse.data.data
      
      // Check if vehicle plate number contains _DELETED_
      if (vehicle.plateNumber.includes('_DELETED_')) {
        alert('Bu serviceni tahrirlash mumkin emas, chunki mashina o\'chirilgan va raqami qayta ishlatilgan.')
        return
      }
      
      // Navigate to vehicle detail page where edit functionality exists
      router.push(`/dashboard/service/${service.vehicle._id}`)
    } catch (error: any) {
      if (error.response?.status === 404) {
        alert('Bu serviceni tahrirlash mumkin emas, chunki mashina o\'chirilgan.')
      } else {
        alert('Failed to check vehicle status')
      }
    }
  }

  const loadRecentServices = async () => {
    try {
      setLoadingServices(true)
      
      // Load both oil changes and general services
      const [oilChangesRes, generalServicesRes] = await Promise.all([
        api.get('/oil-changes', { params: { page: 1, limit: 50 } }),
        api.get('/services', { params: { page: 1, limit: 50 } })
      ])
      
      // Format oil changes
      const oilChanges = (oilChangesRes.data.data || [])
        .filter((s: any) => s.vehicle)
        .map((s: any) => ({
          ...s,
          type: 'oilChange',
          serviceName: 'Moy almashtirish'
        }))
      
      // Format general services
      const generalServices = (generalServicesRes.data.data || [])
        .filter((s: any) => s.vehicle)
        .map((s: any) => ({
          ...s,
          type: 'service',
          serviceName: `Ish sessiyasi (${s.services?.length || 0} ta)`
        }))
      
      // Merge and sort by date
      const allServices = [...oilChanges, ...generalServices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      // Paginate
      const startIndex = (servicesPage - 1) * 10
      const paginatedServices = allServices.slice(startIndex, startIndex + 10)
      
      setRecentServices(paginatedServices)
      setServicesTotalPages(Math.ceil(allServices.length / 10))
    } catch (error) {
      console.error('Failed to load services:', error)
      setRecentServices([])
    } finally {
      setLoadingServices(false)
    }
  }

  const loadGeneralServices = async () => {
    try {
      setLoadingGeneralServices(true)
      const response = await api.get('/services', {
        params: {
          page: generalServicesPage,
          limit: 10
        }
      })
      
      const validServices = (response.data.data || []).filter((s: any) => s.vehicle)
      setGeneralServices(validServices)
      setGeneralServicesTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error('Failed to load general services:', error)
      setGeneralServices([])
    } finally {
      setLoadingGeneralServices(false)
    }
  }

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true)
      const response = await api.get('/vehicles', {
        params: {
          page: vehiclesPage,
          limit: 10
        }
      })
      
      // Filter out vehicles without customer data
      const validVehicles = (response.data.data || []).filter((v: Vehicle) => v.customer)
      setVehicles(validVehicles)
      setVehiclesTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
      setVehicles([])
    } finally {
      setLoadingVehicles(false)
    }
  }

  const handlePlateNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    let value = ''
    
    // First 2 characters must be numbers
    if (input.length >= 1) {
      value += input[0].replace(/[^0-9]/g, '')
    }
    if (input.length >= 2) {
      value += input[1].replace(/[^0-9]/g, '')
    }
    // Remaining characters can be letters and numbers
    if (input.length > 2) {
      value += input.slice(2, 8)
    }
    
    setPlateNumber(value)
    setSearchResult(null)
    
    // Auto-search when exactly 8 characters
    if (value.length === 8) {
      handleSearch(value)
    }
  }

  const handleSearch = async (plateValue?: string) => {
    const searchValue = plateValue || plateNumber
    if (searchValue.length !== 8) return

    try {
      setIsSearching(true)
      setSearchResult(null)
      
      const response = await api.get(`/vehicles/search/${searchValue}`)
      
      if (response.data.data) {
        // Vehicle found - redirect to detail page
        router.push(`/dashboard/service/${response.data.data._id}`)
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchResult('not-found')
      } else {
        alert('Search failed')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddVehicle = () => {
    router.push(`/dashboard/service/add?plate=${plateNumber}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Xizmat markazi</h1>
        <p className="text-muted-foreground mt-1">Mashinani qidiring va xizmatlarni boshqaring</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mashinani topish</CardTitle>
          <CardDescription>Boshlash uchun davlat raqamini kiriting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="01A234BC"
                value={plateNumber}
                onChange={handlePlateNumberChange}
                onKeyDown={(e) => e.key === 'Enter' && plateNumber.length === 8 && handleSearch()}
                className="text-3xl font-bold text-center tracking-widest"
                disabled={isSearching}
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {plateNumber.length}/8 belgi
              </p>
            </div>
            <Button 
              onClick={() => handleSearch()} 
              size="lg"
              disabled={isSearching || plateNumber.length !== 8}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Qidirish
                </>
              )}
            </Button>
          </div>

          {searchResult === 'not-found' && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/50 border-2 border-yellow-500 dark:border-yellow-500 rounded-lg">
              <p className="text-sm text-yellow-900 dark:text-yellow-200 mb-3">
                <strong>{plateNumber}</strong> raqamli mashina bazada topilmadi.
              </p>
              <Button onClick={handleAddVehicle} className="gap-2">
                <Plus className="w-4 h-4" />
                Yangi mashina qo'shish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Barcha xizmatlar</TabsTrigger>
          <TabsTrigger value="vehicles">Barcha mashinalar</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Xizmatlar tarixi
              </CardTitle>
              <CardDescription>Moy almashtirish va ish sessiyalari</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingServices ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentServices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Hali xizmatlar yo'q
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Raqam</TableHead>
                        <TableHead>Mashina</TableHead>
                        <TableHead>Xizmat</TableHead>
                        <TableHead>To'lov holati</TableHead>
                        <TableHead className="text-right">Narx</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentServices.map((service: any) => (
                        <TableRow key={service._id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>{new Date(service.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{service.vehicle?.plateNumber}</TableCell>
                          <TableCell>{service.vehicle?.brand} {service.vehicle?.vehicleModel}</TableCell>
                          <TableCell>
                            {service.type === 'oilChange' ? (
                              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                Moy almashtirish
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                Ish sessiyasi ({service.services?.length || 0} ta)
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {service.paymentStatus === 'paid' && <Badge className="bg-green-600 dark:bg-green-700">To'langan</Badge>}
                            {service.paymentStatus === 'partial' && <Badge variant="secondary">Qisman</Badge>}
                            {service.paymentStatus === 'unpaid' && <Badge variant="destructive">To'lanmagan</Badge>}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {(service.price || service.totalPrice || 0).toLocaleString()} so'm
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/service/${service.vehicle._id}`)}
                            >
                              Ko'rish
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {servicesTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Sahifa {servicesPage} / {servicesTotalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setServicesPage(p => Math.max(1, p - 1))}
                          disabled={servicesPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setServicesPage(p => Math.min(servicesTotalPages, p + 1))}
                          disabled={servicesPage === servicesTotalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Mashinalar bazasi
              </CardTitle>
              <CardDescription>Barcha ro'yxatdan o'tgan mashinalar</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVehicles ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : vehicles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Hali mashinalar ro'yxatdan o'tmagan
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Davlat raqami</TableHead>
                        <TableHead>Mashina</TableHead>
                        <TableHead>Dvigatel turi</TableHead>
                        <TableHead>Mijoz</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Qarz</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle) => (
                        <TableRow key={vehicle._id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {vehicle.plateNumber}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {vehicle.brand} {vehicle.vehicleModel}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {vehicle.engineType}
                            </Badge>
                          </TableCell>
                          <TableCell>{vehicle.customer?.name || 'N/A'}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {vehicle.customer?.phone || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {vehicle.customer?.totalDebt !== undefined && vehicle.customer.totalDebt > 0 ? (
                              <Badge variant="destructive" className="font-mono">
                                {vehicle.customer.totalDebt.toLocaleString()} so'm
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-500">
                                To'langan
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/service/${vehicle._id}`)}
                            >
                              Xizmat
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {vehiclesTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Sahifa {vehiclesPage} / {vehiclesTotalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVehiclesPage(p => Math.max(1, p - 1))}
                          disabled={vehiclesPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Oldingi
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVehiclesPage(p => Math.min(vehiclesTotalPages, p + 1))}
                          disabled={vehiclesPage === vehiclesTotalPages}
                        >
                          Keyingi
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Detail Modal */}
      <Dialog open={showServiceDetail} onOpenChange={setShowServiceDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Oil Change Service Details</DialogTitle>
            <DialogDescription>
              Service ID: {selectedService?._id}
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-6">
              {/* Vehicle Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plate Number</p>
                    <p className="font-semibold">{selectedService.vehicle?.plateNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vehicle</p>
                    <p className="font-semibold">
                      {selectedService.vehicle?.brand} {selectedService.vehicle?.vehicleModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-semibold">{selectedService.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-semibold">{selectedService.customer?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Service Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {new Date(selectedService.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mileage</p>
                    <p className="font-semibold">{selectedService.mileage?.toLocaleString() || 'N/A'} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Oil Quantity</p>
                    <p className="font-semibold">{selectedService.oilQuantityUsed || 'N/A'} L</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Service</p>
                    <p className="font-semibold">{selectedService.nextServiceMileage?.toLocaleString() || 'N/A'} km</p>
                  </div>
                </div>
              </div>

              {/* Products Used */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Products Used</h3>
                <div className="space-y-2 text-sm">
                  {selectedService.oilProduct && (
                    <div className="flex justify-between">
                      <span>Oil Product:</span>
                      <span className="font-semibold">{selectedService.oilProduct.name || 'N/A'}</span>
                    </div>
                  )}
                  {selectedService.oilProductCustomerProvided && (
                    <div className="flex justify-between">
                      <span>Oil (Customer Provided):</span>
                      <span className="font-semibold">{selectedService.oilProductCustomerProvidedDetails || 'Yes'}</span>
                    </div>
                  )}
                  {selectedService.oilFilter && (
                    <div className="flex justify-between">
                      <span>Oil Filter:</span>
                      <span className="font-semibold">{selectedService.oilFilter.brand || 'N/A'}</span>
                    </div>
                  )}
                  {selectedService.oilFilterCustomerProvided && (
                    <div className="flex justify-between">
                      <span>Oil Filter (Customer Provided):</span>
                      <span className="font-semibold">{selectedService.oilFilterCustomerProvidedDetails || 'Yes'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Employees */}
              {selectedService.employees && selectedService.employees.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">Employees</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedService.employees.map((emp: any) => (
                      <Badge key={emp._id} variant="secondary">
                        {emp.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Cost Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Labor Cost:</span>
                    <span className="font-semibold">{(selectedService.laborCost || 0).toLocaleString()} UZS</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{(selectedService.price || 0).toLocaleString()} UZS</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEditService(selectedService)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => viewServiceHistory(selectedService._id)}
                  className="flex-1"
                >
                  <History className="w-4 h-4 mr-2" />
                  Ta'rix
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteService(selectedService._id)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
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
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-200 border-green-200 dark:border-green-700'
                              : entry.action === 'updated'
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700'
                              : 'bg-orange-100 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-700'
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
