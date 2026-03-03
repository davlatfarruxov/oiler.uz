'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api/axios'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PublicServicePage() {
  const params = useParams()
  const [serviceData, setServiceData] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServiceData()
  }, [params.id])

  const fetchServiceData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch service data (try oil change first, then general service)
      let serviceResponse
      let serviceType = 'oilChange'
      
      try {
        serviceResponse = await api.get(`/oil-changes/${params.id}/public`)
      } catch (err: any) {
        if (err.response?.status === 404) {
          serviceResponse = await api.get(`/services/${params.id}/public`)
          serviceType = 'service'
        } else {
          throw err
        }
      }
      
      const service = serviceResponse.data.data
      
      // Fetch company settings
      const settingsResponse = await api.get('/settings/public')
      const settings = settingsResponse.data.data
      
      setServiceData({ ...service, type: serviceType })
      setCompanySettings(settings)
    } catch (err: any) {
      console.error('Failed to load service data:', err)
      setError(err.response?.data?.message || 'Xizmat topilmadi')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !serviceData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xl font-semibold text-red-600 mb-2">Xatolik</p>
              <p className="text-gray-600">{error || 'Xizmat topilmadi'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="text-center">
              <CardTitle className="text-2xl font-bold mb-2">
                {companySettings?.companyName || 'OILER.UZ'}
              </CardTitle>
              {companySettings?.companyPhone && (
                <p className="text-blue-100">{companySettings.companyPhone}</p>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Vehicle Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Mashina ma'lumotlari</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Raqam:</p>
                  <p className="font-semibold text-gray-900">{serviceData.vehicle?.plateNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Model:</p>
                  <p className="font-semibold text-gray-900">
                    {serviceData.vehicle?.brand} {serviceData.vehicle?.vehicleModel}
                  </p>
                </div>
              </div>
            </div>

            {/* Mileage Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Probeg ma'lumotlari</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Hozirgi:</p>
                  <p className="font-semibold text-gray-900">{serviceData.mileage?.toLocaleString()} km</p>
                </div>
                {serviceData.nextServiceMileage && (
                  <div>
                    <p className="text-gray-600">Keyingi xizmat:</p>
                    <p className="font-semibold text-gray-900">{serviceData.nextServiceMileage.toLocaleString()} km</p>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-gray-600">Sana:</p>
                <p className="font-semibold text-gray-900">
                  {new Date(serviceData.createdAt).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Oil Change Details */}
            {serviceData.type === 'oilChange' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">Xizmat tafsilotlari</h3>
                <div className="space-y-2 text-sm">
                  {serviceData.oilProduct && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Moy:</span>
                      <span className="font-semibold text-gray-900">
                        {typeof serviceData.oilProduct === 'object' 
                          ? `${serviceData.oilProduct.brand} ${serviceData.oilProduct.viscosity} (${serviceData.oilQuantityUsed}L)`
                          : serviceData.oilProductCustomerProvidedDetails || 'N/A'}
                      </span>
                    </div>
                  )}
                  
                  {serviceData.oilFilter && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Moy filteri:</span>
                      <span className="font-semibold text-gray-900">
                        {typeof serviceData.oilFilter === 'object'
                          ? `${serviceData.oilFilter.brandName} ${serviceData.oilFilter.partNumber}`
                          : serviceData.oilFilterCustomerProvidedDetails || 'N/A'}
                      </span>
                    </div>
                  )}
                  
                  {serviceData.airFilter && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Havo filteri:</span>
                      <span className="font-semibold text-gray-900">
                        {typeof serviceData.airFilter === 'object'
                          ? `${serviceData.airFilter.brandName} ${serviceData.airFilter.partNumber}`
                          : serviceData.airFilterCustomerProvidedDetails || 'N/A'}
                      </span>
                    </div>
                  )}
                  
                  {serviceData.cabinFilter && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Salon filteri:</span>
                      <span className="font-semibold text-gray-900">
                        {typeof serviceData.cabinFilter === 'object'
                          ? `${serviceData.cabinFilter.brandName} ${serviceData.cabinFilter.partNumber}`
                          : serviceData.cabinFilterCustomerProvidedDetails || 'N/A'}
                      </span>
                    </div>
                  )}
                  
                  {serviceData.fuelFilter && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Yoqilg'i filteri:</span>
                      <span className="font-semibold text-gray-900">
                        {typeof serviceData.fuelFilter === 'object'
                          ? `${serviceData.fuelFilter.brandName} ${serviceData.fuelFilter.partNumber}`
                          : serviceData.fuelFilterCustomerProvidedDetails || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Employees */}
            {serviceData.employees && serviceData.employees.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">Xodimlar</h3>
                <div className="flex flex-wrap gap-2">
                  {serviceData.employees.map((emp: any, idx: number) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {typeof emp === 'object' ? emp.name : emp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
