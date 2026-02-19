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
      
      setSaveMessage({ type: 'success', text: 'Company information updated successfully!' })
    } catch (error: any) {
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update company information' 
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
          text: 'Please enter a valid exchange rate (positive number)' 
        })
        return
      }
      
      const api = (await import('@/lib/api/axios')).default
      const response = await api.put('/settings/exchange-rate', { exchangeRate: rateValue })
      
      setSaveMessage({ type: 'success', text: 'Exchange rate updated successfully!' })
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error: any) {
      console.error('Exchange rate update error:', error)
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update exchange rate' 
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
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage application and business settings</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            Security
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
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenantLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="info@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessPhone">Business Phone</Label>
                    <Input
                      id="businessPhone"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St, Tashkent"
                    />
                  </div>
                  <Button onClick={handleSaveCompanyInfo} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Settings</CardTitle>
              <CardDescription>Configure service defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultOil">Default Oil Type</Label>
                <Select defaultValue="5w30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5w30">5W-30</SelectItem>
                    <SelectItem value="10w40">10W-40</SelectItem>
                    <SelectItem value="synthetic">Synthetic 5W-30</SelectItem>
                    <SelectItem value="highmileage">High Mileage 10W-40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="serviceInterval">Service Interval (km)</Label>
                <Input id="serviceInterval" type="number" defaultValue="5000" />
              </div>
              <div>
                <Label htmlFor="serviceIntervalMonths">Service Interval (Months)</Label>
                <Input id="serviceIntervalMonths" type="number" defaultValue="6" />
              </div>
              <Button>Save Service Defaults</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exchange Rate</CardTitle>
              <CardDescription>Set USD to UZS exchange rate for cost calculations</CardDescription>
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
                  This rate is used when adding products with USD cost price
                </p>
              </div>
              <Button 
                onClick={handleUpdateExchangeRate} 
                disabled={isSaving}
              >
                {isSaving ? 'Updating...' : 'Update Exchange Rate'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>View your subscription details and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold capitalize">{tenant?.plan || 'Free'}</p>
                    <Badge variant={getPlanBadgeColor(tenant?.plan || 'free')}>
                      {tenant?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Max Employees</p>
                  <p className="text-xl font-semibold">
                    {tenant?.maxEmployees === -1 ? 'Unlimited' : tenant?.maxEmployees || 5}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Max Vehicles</p>
                  <p className="text-xl font-semibold">
                    {tenant?.maxVehicles === -1 ? 'Unlimited' : tenant?.maxVehicles || 100}
                  </p>
                </div>
              </div>

              {tenant?.expiresAt && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Expires At</p>
                  <p className="text-lg font-semibold mt-1">
                    {new Date(tenant.expiresAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Want to upgrade your plan? Contact support for more information.
                </p>
                <Button variant="outline" disabled>
                  Upgrade Plan (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive SMS alerts for urgent matters</p>
                </div>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
                </div>
                <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Daily Report</p>
                  <p className="text-sm text-muted-foreground">Receive daily summary at 6 PM</p>
                </div>
                <Switch checked={dailyReport} onCheckedChange={setDailyReport} />
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Two-factor authentication is not currently enabled.</p>
              <Button>Enable 2FA</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-2">Delete Account</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
