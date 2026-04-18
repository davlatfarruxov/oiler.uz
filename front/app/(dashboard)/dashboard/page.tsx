'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/store/hooks'
import { useCanShowSection } from '@/lib/uiPermissions'
import api from '@/lib/api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, Car, DollarSign, AlertCircle, Loader2, Wrench, CreditCard } from 'lucide-react'
import { OverduePaymentsAlert } from '@/components/OverduePaymentsAlert'

const StatCard = ({ title, value, icon: Icon, description, isLoading }: any) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth)
  const can = useCanShowSection()
  const [stats, setStats] = useState({
    todayServices: 0,
    totalVehicles: 0,
    monthlyRevenue: 0,
    lowStockAlerts: 0,
    totalOutstandingDebt: 0,
    overduePaymentsCount: 0,
    employeeDebt: 0
  })
  const [recentServices, setRecentServices] = useState<any[]>([])
  const [overdueServices, setOverdueServices] = useState<any[]>([])
  const [activeServices, setActiveServices] = useState<any[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch basic stats
      const [todayCount, vehiclesCount, monthlyRevenue, lowStock, recent, overdue, activeServicesRes, employeeDebtRes] = await Promise.all([
        api.get('/oil-changes/today-count'),
        api.get('/vehicles/count'),
        api.get('/oil-changes/monthly-revenue'),
        api.get('/inventory/low-stock').catch((err) => {
          console.error('Failed to fetch low stock:', err)
          return { data: { data: [] } }
        }),
        api.get('/oil-changes/recent?limit=5'),
        api.get('/payments/overdue'),
        api.get('/vehicles/active-services').catch(err => {
          console.error('Failed to fetch active services:', err)
          return { data: { data: [] } }
        }),
        api.get('/employees/debt/total').catch(err => {
          console.error('Failed to fetch employee debt:', err)
          return { data: { data: { totalDebt: 0 } } }
        })
      ])

      // Calculate total debt from overdue services
      const overdueData = overdue.data.data || []
      const totalDebt = overdueData.reduce((sum: number, service: any) => sum + (service.amountDue || 0), 0)

      setStats({
        todayServices: todayCount.data.data.count,
        totalVehicles: vehiclesCount.data.data.count,
        monthlyRevenue: monthlyRevenue.data.data.revenue,
        lowStockAlerts: lowStock.data.data.length,
        totalOutstandingDebt: totalDebt,
        overduePaymentsCount: overdueData.length,
        employeeDebt: employeeDebtRes.data.data.totalDebt || 0
      })

      setRecentServices(recent.data.data)
      setOverdueServices(overdueData)
      setRecentPayments([]) // Will be populated later if needed
      setActiveServices(activeServicesRes.data.data || [])
      
      console.log('Active services:', activeServicesRes.data.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const revenueData = [
    { date: 'Jan', revenue: 3200, services: 32 },
    { date: 'Feb', revenue: 2800, services: 28 },
    { date: 'Mar', revenue: 4100, services: 41 },
    { date: 'Apr', revenue: 3900, services: 39 },
    { date: 'May', revenue: 4300, services: 43 },
    { date: 'Jun', revenue: 5100, services: 51 },
  ]

  const oilTypesData = [
    { name: '5W-30', value: 45, color: 'var(--color-chart-1)' },
    { name: '10W-40', value: 30, color: 'var(--color-chart-2)' },
    { name: 'Synthetic', value: 25, color: 'var(--color-chart-3)' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bosh sahifa</h1>
        <p className="text-muted-foreground mt-1">Xush kelibsiz, {user?.name}!</p>
      </div>

      {can('ui.dashboard.stats_kpis') && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bugungi xizmatlar"
          value={stats.todayServices}
          icon={Wrench}
          description={stats.todayServices > 0 ? "Bugun bajarilgan xizmatlar" : "Hali xizmat yo'q"}
          isLoading={isLoading}
        />
        <StatCard
          title="Jami mashinalar"
          value={stats.totalVehicles}
          icon={Car}
          description={stats.totalVehicles > 0 ? "Ro'yxatdan o'tgan mashinalar" : "Hali mashina yo'q"}
          isLoading={isLoading}
        />
        <StatCard
          title="Oylik daromad"
          value={`${(stats.monthlyRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          description="Shu oy"
          isLoading={isLoading}
        />
        <StatCard
          title="Kam qolgan mahsulotlar"
          value={stats.lowStockAlerts}
          icon={AlertCircle}
          description={stats.lowStockAlerts > 0 ? "Mahsulotlar tugamoqda" : "Barcha mahsulotlar yetarli"}
          isLoading={isLoading}
        />
      </div>
      )}

      {/* Payment Tracking Stats */}
      {can('ui.dashboard.stats_payments') && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Jami qarz (mijozlar)</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-500 mt-2">
                      {(stats.totalOutstandingDebt || 0).toLocaleString()} so'm
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Barcha mijozlarning qarzi
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <CreditCard className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Muddati o'tgan to'lovlar</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-2">
                      {stats.overduePaymentsCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      To'lov muddati o'tgan xizmatlar
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Xodimlarga qarz</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {(stats.employeeDebt || 0).toLocaleString()} so'm
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Berish kerak bo'lgan komissiya
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Overdue Payments Alert */}
      {can('ui.dashboard.overdue_alert') && !isLoading && overdueServices.length > 0 && (
        <OverduePaymentsAlert
          overdueServices={overdueServices}
          totalOverdueAmount={overdueServices.reduce((sum, s) => sum + s.amountDue, 0)}
        />
      )}

      {/* Active Services Alert */}
      {can('ui.dashboard.active_services') && (
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
            <CardTitle className="text-yellow-900 dark:text-yellow-400">Tugallanmagan xizmatlar</CardTitle>
          </div>
          <CardDescription className="text-yellow-700 dark:text-yellow-500">
            {isLoading ? (
              'Yuklanmoqda...'
            ) : activeServices.length === 0 ? (
              'Hozircha faol xizmatlar yo\'q'
            ) : (
              `${activeServices.length} ta faol xizmat tugallanishni kutmoqda`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeServices.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-yellow-400 dark:text-yellow-600 mx-auto mb-3" />
              <p className="text-muted-foreground">Barcha xizmatlar tugallangan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeServices.map((service: any) => (
                <div
                  key={service._id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-yellow-400 dark:border-yellow-600 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/service/${service.vehicle._id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-foreground text-lg">
                        {service.vehicle?.plateNumber || 'N/A'}
                      </p>
                      <span className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 rounded-full font-medium">
                        Faol
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Mijoz: {service.customer?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Xizmatlar: {service.services?.length || 0} ta
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Boshlangan: {new Date(service.createdAt).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {(service.totalPrice || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">so'm</p>
                    {service.paymentStatus === 'paid' && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        To'langan
                      </span>
                    )}
                    {service.paymentStatus === 'partial' && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                        Qisman
                      </span>
                    )}
                    {service.paymentStatus === 'unpaid' && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                        To'lanmagan
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {can('ui.dashboard.charts') && (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daromad va xizmatlar</CardTitle>
            <CardDescription>Oylik ko'rsatkichlar</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" name="Daromad ($)" />
                <Bar dataKey="services" fill="var(--color-chart-2)" name="Xizmatlar" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ishlatilgan moy turlari</CardTitle>
            <CardDescription>Shu oy</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={oilTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="var(--color-primary)"
                  dataKey="value"
                >
                  {oilTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Xizmatlar tendensiyasi</CardTitle>
          <CardDescription>Oxirgi oyning kunlik xizmatlar hajmi</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="services"
                stroke="var(--color-primary)"
                name="Xizmatlar"
                dot={{ fill: 'var(--color-primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </>
      )}

      {can('ui.dashboard.recent_services') && (
      <Card>
        <CardHeader>
          <CardTitle>So'nggi xizmatlar</CardTitle>
          <CardDescription>Oxirgi moy almashtirish xizmatlari</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentServices.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">So'nggi xizmatlar yo'q</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Mashina</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Mijoz</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Moy turi</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Narx</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {recentServices.map((service) => (
                    <tr key={service._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">
                        {service.vehicle?.plateNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {service.customer?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                          {service.oilType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">{service.price.toLocaleString()} so'm</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {new Date(service.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Recent Payments Widget - Temporarily disabled until API is available */}
      {/* <Card>
        <CardHeader>
          <CardTitle>So'nggi to'lovlar</CardTitle>
          <CardDescription>Oxirgi qabul qilingan to'lovlar</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Hali to'lovlar yo'q</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment: any) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">
                        {payment.customer?.name || 'N/A'}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {payment.vehicle?.plateNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">
                        {payment.paymentMethod === 'cash' ? 'Naqd' :
                         payment.paymentMethod === 'card' ? 'Karta' :
                         payment.paymentMethod === 'transfer' ? 'O\'tkazma' :
                         payment.paymentMethod}
                      </span>
                      <span>•</span>
                      <span>{new Date(payment.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {(payment.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">so'm</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  )
}
