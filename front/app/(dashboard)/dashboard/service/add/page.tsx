'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft } from 'lucide-react'

// O'zbekistonda eng ko'p uchraydigan mashinalar (brend → modellar)
const UZ_CARS: Record<string, string[]> = {
  'Chevrolet': ['Spark', 'Cobalt', 'Nexia', 'Nexia 2', 'Nexia 3', 'Gentra', 'Lacetti', 'Malibu', 'Malibu 2', 'Captiva', 'Tracker', 'Onix', 'Tahoe', 'Equinox', 'Traverse', 'Trailblazer', 'Orlando', 'Epica', 'Matiz', 'Damas', 'Labo'],
  'Daewoo': ['Matiz', 'Nexia', 'Gentra', 'Damas', 'Labo', 'Tico', 'Nubira', 'Lacetti'],
  'Ravon': ['R2', 'R3', 'R4', 'Nexia R3', 'Gentra', 'Matiz'],
  'BYD': ['Chazor', 'Song Plus', 'Han', 'Seal', 'Yuan Plus', 'Dolphin'],
  'Toyota': ['Camry', 'Corolla', 'Land Cruiser', 'Land Cruiser Prado', 'RAV4', 'Highlander', 'Avalon', 'Yaris', 'Fortuner', 'Hilux'],
  'Kia': ['K5', 'Sportage', 'Sorento', 'Cerato', 'Optima', 'Sonet', 'Seltos', 'Rio', 'Carnival'],
  'Hyundai': ['Sonata', 'Elantra', 'Tucson', 'Santa Fe', 'Accent', 'Creta', 'Palisade', 'Solaris'],
  'Lada (VAZ)': ['2106', '2107', '2110', '2114', 'Niva', 'Granta', 'Vesta', 'Largus', 'Priora'],
  'Nissan': ['Almera', 'Qashqai', 'X-Trail', 'Patrol', 'Sunny', 'Teana'],
  'Volkswagen': ['Polo', 'Passat', 'Tiguan', 'Jetta', 'Touareg'],
  'Mercedes-Benz': ['E-Class', 'C-Class', 'S-Class', 'GLE', 'GLС', 'Sprinter', 'Vito'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X5', 'X6', 'X3'],
  'Mitsubishi': ['Lancer', 'Outlander', 'Pajero', 'ASX', 'Montero'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot'],
  'Ssangyong': ['Actyon', 'Rexton', 'Korando', 'Tivoli'],
  'GAZ': ['Gazel', 'Gazel Next', 'Sobol'],
  'Isuzu': ['D-Max', 'NQR', 'NPR'],
}

const CAR_BRANDS = Object.keys(UZ_CARS)

export default function AddVehiclePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    plateNumber: searchParams.get('plate') || '',
    brand: '',
    vehicleModel: '',
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

    // Davlat raqami uzunligini tekshirish
    if (formData.plateNumber.length !== 8) {
      alert("Davlat raqami aniq 8 ta belgidan iborat bo'lishi kerak")
      return
    }

    try {
      setIsSaving(true)
      const response = await api.post('/vehicles', formData)
      alert("Mashina muvaffaqiyatli qo'shildi!")
      router.push(`/dashboard/service/${response.data.data._id}?from=register`)
    } catch (error: any) {
      alert(error.response?.data?.message || "Mashina qo'shishda xatolik yuz berdi")
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
          <h1 className="text-3xl font-bold text-foreground">Yangi mashina qo'shish</h1>
          <p className="text-muted-foreground mt-1">Mashina va mijoz ma'lumotlarini kiriting</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mashina ma'lumotlari</CardTitle>
          <CardDescription>Barcha majburiy maydonlarni to'ldiring</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="plateNumber">Davlat raqami *</Label>
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
                {formData.plateNumber.length}/8 ta belgi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Marka *</Label>
                <Input
                  id="brand"
                  list="car-brands"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value, vehicleModel: '' })}
                  placeholder="Tanlang yoki yozing (masalan: Chevrolet)"
                  autoComplete="off"
                  required
                />
                <datalist id="car-brands">
                  {CAR_BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="vehicleModel">Model *</Label>
                <Input
                  id="vehicleModel"
                  list="car-models"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  placeholder="Tanlang yoki yozing (masalan: Cobalt)"
                  autoComplete="off"
                  required
                />
                <datalist id="car-models">
                  {(UZ_CARS[formData.brand] || []).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Mijoz ma'lumotlari</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Mijoz ismi *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Masalan: Alisher Karimov"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefon raqami *</Label>
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
                    Qo'shilmoqda...
                  </>
                ) : (
                  "Mashinani qo'shish"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Bekor qilish
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
