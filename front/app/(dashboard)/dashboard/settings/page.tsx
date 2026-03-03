'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/lib/contexts/TenantContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Bell, Lock, Users, Building2, CreditCard, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SettingsPage() {
  const { tenant, isLoading: tenantLoading, updateTenant } = useTenant()
  
  // Company Info State
  const [companyName, setCompanyName] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [address, setAddress] = useState('')
  const [exchangeRate, setExchangeRate] = useState('12500')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Notification State
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [dailyReport, setDailyReport] = useState(true)

  // Load tenant data and settings
  useEffect(() => {
    const loadSettings = async () => {
      if (tenant) {
        setCompanyName(tenant.companyName || '')
        setBusinessEmail(tenant.businessEmail || '')
        setBusinessPhone(tenant.businessPhone || '')
        setAddress(tenant.address || '')
        
        // Load exchange rate from settings
        try {
          const api = (await import('@/lib/api/axios')).default
          const response = await api.get('/settings')
          if (response.data?.data?.exchangeRate) {
            setExchangeRate(String(response.data.data.exchangeRate))
          }
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
    }
    
    loadSettings()
  }, [tenant])

  const handleSaveCompanyInfo = async () => {
    try {
      setIsSaving(true)
      setSaveMessage(null)
      
      await updateTenant({
        companyName,
        businessEmail,
        businessPhone,
        address
      })
      
      setSaveMessage({ type: 'success', text: 'Kompaniya ma\'lumotlari muvaffaqiyatli yangilandi!' })
    } catch (error: any) {
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Kompaniya ma\'lumotlarini yangilashda xatolik' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateExchangeRate = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      const rateValue = Number(exchangeRate)
      
      if (isNaN(rateValue) || rateValue <= 0) {
        setSaveMessage({ 
          type: 'error', 
          text: 'Iltimos, to\'g\'ri kurs qiymatini kiriting (musbat son)' 
        })
        return
      }
      
      const api = (await import('@/lib/api/axios')).default
      const response = await api.put('/settings/exchange-rate', { exchangeRate: rateValue })
      
      setSaveMessage({ type: 'success', text: 'Valyuta kursi muvaffaqiyatli yangilandi!' })
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error: any) {
      console.error('Exchange rate update error:', error)
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Valyuta kursini yangilashda xatolik' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'free': return 'secondary'
      case 'premium': return 'default'
      case 'enterprise': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sozlamalar</h1>
        <p className="text-muted-foreground mt-1">Ilova va biznes sozlamalarini boshqarish</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            Kompaniya
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Obuna
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Bildirishnomalar
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            Xavfsizlik
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-4">
          {saveMessage && (
            <Alert variant={saveMessage.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{saveMessage.text}</AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Biznes ma'lumotlari</CardTitle>
              <CardDescription>Biznes tafsilotlari va aloqa ma'lumotlarini yangilash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenantLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="company">Kompaniya nomi</Label>
                    <Input
                      id="company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Kompaniya nomi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessEmail">Biznes email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="info@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessPhone">Biznes telefon</Label>
                    <Input
                      id="businessPhone"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Manzil</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Toshkent shahar"
                    />
                  </div>
                  <Button onClick={handleSaveCompanyInfo} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      'O\'zgarishlarni saqlash'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Xizmat sozlamalari</CardTitle>
              <CardDescription>Xizmat standart sozlamalarini sozlash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultOil">Standart moy turi</Label>
                <Select defaultValue="5w30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5w30">5W-30</SelectItem>
                    <SelectItem value="10w40">10W-40</SelectItem>
                    <SelectItem value="synthetic">Sintetik 5W-30</SelectItem>
                    <SelectItem value="highmileage">Yuqori probeg 10W-40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="serviceInterval">Xizmat intervali (km)</Label>
                <Input id="serviceInterval" type="number" defaultValue="5000" />
              </div>
              <div>
                <Label htmlFor="serviceIntervalMonths">Xizmat intervali (oy)</Label>
                <Input id="serviceIntervalMonths" type="number" defaultValue="6" />
              </div>
              <Button>Standart sozlamalarni saqlash</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valyuta kursi</CardTitle>
              <CardDescription>Xarajatlarni hisoblash uchun USD dan UZS ga kursni belgilash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="exchangeRate">1 USD = ? UZS</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  placeholder="12500"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu kurs USD tannarxli mahsulotlar qo'shilganda ishlatiladi
                </p>
              </div>
              <Button 
                onClick={handleUpdateExchangeRate} 
                disabled={isSaving}
              >
                {isSaving ? 'Yangilanmoqda...' : 'Valyuta kursini yangilash'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Joriy tarif</CardTitle>
              <CardDescription>Obuna tafsilotlari va cheklovlarni ko'rish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tarif turi</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold capitalize">{tenant?.plan || 'Bepul'}</p>
                    <Badge variant={getPlanBadgeColor(tenant?.plan || 'free')}>
                      {tenant?.isActive ? 'Faol' : 'Nofaol'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Maksimal xodimlar</p>
                  <p className="text-xl font-semibold">
                    {tenant?.maxEmployees === -1 ? 'Cheksiz' : tenant?.maxEmployees || 5}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Maksimal mashinalar</p>
                  <p className="text-xl font-semibold">
                    {tenant?.maxVehicles === -1 ? 'Cheksiz' : tenant?.maxVehicles || 100}
                  </p>
                </div>
              </div>

              {tenant?.expiresAt && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Amal qilish muddati</p>
                  <p className="text-lg font-semibold mt-1">
                    {new Date(tenant.expiresAt).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Tarifni yangilashni xohlaysizmi? Qo'shimcha ma'lumot uchun qo'llab-quvvatlash xizmatiga murojaat qiling.
                </p>
                <Button variant="outline" disabled>
                  Tarifni yangilash (Tez orada)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bildirishnoma sozlamalari</CardTitle>
              <CardDescription>Ogohlantirishlar va yangilanishlarni qabul qilishni boshqarish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Email bildirishnomalar</p>
                  <p className="text-sm text-muted-foreground">Muhim voqealar uchun email ogohlantirishlari</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">SMS bildirishnomalar</p>
                  <p className="text-sm text-muted-foreground">Shoshilinch holatlar uchun SMS ogohlantirishlari</p>
                </div>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Kam qoldiq ogohlantirishlari</p>
                  <p className="text-sm text-muted-foreground">Ombor qoldig'i kam bo'lganda xabar olish</p>
                </div>
                <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Kunlik hisobot</p>
                  <p className="text-sm text-muted-foreground">Har kuni soat 18:00 da qisqacha hisobot olish</p>
                </div>
                <Switch checked={dailyReport} onCheckedChange={setDailyReport} />
              </div>

              <Button>Sozlamalarni saqlash</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parol</CardTitle>
              <CardDescription>Hisob parolingizni o'zgartirish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Joriy parol</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="newPassword">Yangi parol</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Parolni tasdiqlash</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button>Parolni yangilash</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ikki bosqichli autentifikatsiya</CardTitle>
              <CardDescription>Hisobingizga qo'shimcha xavfsizlik qatlami qo'shing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Ikki bosqichli autentifikatsiya hozirda yoqilmagan.</p>
              <Button>2FA ni yoqish</Button>
            </CardContent>
          </Card>

          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400">Xavfli zona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-2">Hisobni o'chirish</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Hisobingizni o'chirsangiz, ortga qaytish yo'q. Iltimos, ishonch hosil qiling.
                  </p>
                  <Button variant="destructive">Hisobni o'chirish</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
