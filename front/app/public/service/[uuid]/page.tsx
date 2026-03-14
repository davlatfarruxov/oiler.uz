'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Car, Calendar, Gauge, Phone, CheckCircle, XCircle } from 'lucide-react'

interface PublicServiceData {
  uuid: string
  plateNumber: string
  vehicleBrand: string
  vehicleModel: string
  customerName: string
  serviceDate: string
  serviceType: string
  currentMileage: number
  nextServiceMileage: number
  companyName: string
  companyPhone: string
  oilInfo?: {
    hasOil: boolean
    oilDetails: string | null
    oilQuantity: number
  }
  filters?: {
    oilFilter: boolean
    airFilter: boolean
    cabinFilter: boolean
    fuelFilter: boolean
  }
  services?: string[]
}

export default function PublicServicePage() {
  const params = useParams()
  const [data, setData] = useState<PublicServiceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServiceData()
  }, [params.uuid])

  const fetchServiceData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/service/${params.uuid}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Xizmat topilmadi')
        } else if (response.status === 429) {
          throw new Error('Juda ko\'p so\'rov yuborildi. Bir daqiqa kutib turing.')
        } else {
          throw new Error('Xizmat ma\'lumotlarini yuklashda xatolik yuz berdi')
        }
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (error: any) {
      console.error('Fetch error:', error)
      setError(error.message || 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Xizmat ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Xatolik</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchServiceData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Qayta urinish
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Ma'lumot topilmadi</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.companyName}</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{data.companyPhone}</span>
          </div>
        </div>

        {/* Vehicle Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Mashina ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Davlat raqami</p>
                <p className="text-xl font-bold text-blue-600">{data.plateNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mashina</p>
                <p className="text-lg font-semibold">{data.vehicleBrand} {data.vehicleModel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mijoz</p>
                <p className="text-lg font-semibold">{data.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Xizmat turi</p>
                <Badge variant="outline" className="text-sm">{data.serviceType}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Date & Mileage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Xizmat sanasi</p>
                  <p className="text-lg font-semibold">
                    {new Date(data.serviceDate).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Gauge className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-500">Hozirgi probeg</p>
                  <p className="text-lg font-semibold">{(data.currentMileage || 0).toLocaleString()} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Service */}
        {data.nextServiceMileage && data.nextServiceMileage > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Keyingi xizmat</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {(data.nextServiceMileage || 0).toLocaleString()} km
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Qolgan: {((data.nextServiceMileage || 0) - (data.currentMileage || 0)).toLocaleString()} km
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Oil Change Details */}
        {data.oilInfo && data.oilInfo.hasOil && (
          <Card>
            <CardHeader>
              <CardTitle>Moy ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Moy turi</p>
                  <p className="font-semibold">{data.oilInfo.oilDetails || 'Mijoz moy'}</p>
                </div>
                {data.oilInfo.oilQuantity && data.oilInfo.oilQuantity > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Miqdor</p>
                    <p className="font-semibold">{data.oilInfo.oilQuantity} L</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {data.filters && (
          <Card>
            <CardHeader>
              <CardTitle>Almashtirilgan filterlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  {data.filters.oilFilter ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={data.filters.oilFilter ? 'text-green-700 font-medium' : 'text-gray-500'}>
                    Moy filteri
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {data.filters.airFilter ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={data.filters.airFilter ? 'text-green-700 font-medium' : 'text-gray-500'}>
                    Havo filteri
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {data.filters.cabinFilter ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={data.filters.cabinFilter ? 'text-green-700 font-medium' : 'text-gray-500'}>
                    Salon filteri
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {data.filters.fuelFilter ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={data.filters.fuelFilter ? 'text-green-700 font-medium' : 'text-gray-500'}>
                    Yoqilg'i filteri
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* General Services */}
        {data.services && data.services.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Bajarilgan xizmatlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.services.map((service, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-gray-500 text-sm">
          <p>Xizmatimizdan foydalanganingiz uchun rahmat!</p>
          <p className="mt-1">© 2024 {data.companyName}</p>
        </div>
      </div>
    </div>
  )
}