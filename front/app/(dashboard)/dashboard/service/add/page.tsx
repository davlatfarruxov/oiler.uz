'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function AddVehiclePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    plateNumber: searchParams.get('plate') || '',
    brand: '',
    vehicleModel: '',
    engineType: 'petrol',
    customerName: '',
    customerPhone: ''
  })

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
    
    setFormData({ ...formData, plateNumber: value })
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // If starts with 998, keep it, otherwise add it
    let phoneDigits = digits
    if (!digits.startsWith('998')) {
      phoneDigits = '998' + digits
    }
    
    // Limit to 12 digits (998 + 9 digits)
    phoneDigits = phoneDigits.slice(0, 12)
    
    // Format: +998 (XX) XXX-XX-XX
    if (phoneDigits.length <= 3) {
      return `+${phoneDigits}`
    } else if (phoneDigits.length <= 5) {
      return `+${phoneDigits.slice(0, 3)} (${phoneDigits.slice(3)}`
    } else if (phoneDigits.length <= 8) {
      return `+${phoneDigits.slice(0, 3)} (${phoneDigits.slice(3, 5)}) ${phoneDigits.slice(5)}`
    } else if (phoneDigits.length <= 10) {
      return `+${phoneDigits.slice(0, 3)} (${phoneDigits.slice(3, 5)}) ${phoneDigits.slice(5, 8)}-${phoneDigits.slice(8)}`
    } else {
      return `+${phoneDigits.slice(0, 3)} (${phoneDigits.slice(3, 5)}) ${phoneDigits.slice(5, 8)}-${phoneDigits.slice(8, 10)}-${phoneDigits.slice(10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, customerPhone: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate plate number length
    if (formData.plateNumber.length !== 8) {
      alert('Plate number must be exactly 8 characters')
      return
    }

    try {
      setIsSaving(true)
      const response = await api.post('/vehicles', formData)
      alert('Vehicle added successfully!')
      router.push(`/dashboard/service/${response.data.data._id}?from=register`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add vehicle')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Vehicle</h1>
          <p className="text-muted-foreground mt-1">Enter vehicle and customer details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
          <CardDescription>Fill in all required fields</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="plateNumber">License Plate Number *</Label>
              <Input
                id="plateNumber"
                placeholder="01A234BC"
                value={formData.plateNumber}
                onChange={handlePlateNumberChange}
                required
                maxLength={8}
                className="text-3xl font-bold text-center tracking-widest mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {formData.plateNumber.length}/8 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Toyota"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">Model *</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  placeholder="Camry"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="engineType">Engine Type *</Label>
              <Select value={formData.engineType} onValueChange={(value) => setFormData({ ...formData, engineType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={handlePhoneChange}
                    placeholder="+998 (90) 123-45-67"
                    required
                    maxLength={19}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: +998 (XX) XXX-XX-XX
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving || formData.plateNumber.length !== 8}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Vehicle...
                  </>
                ) : (
                  'Add Vehicle'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
