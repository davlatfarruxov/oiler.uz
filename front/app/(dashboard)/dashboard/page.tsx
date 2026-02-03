'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/store/hooks'
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
import { TrendingUp, Car, DollarSign, AlertCircle, Loader2, Wrench } from 'lucide-react'

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
  const [stats, setStats] = useState({
    todayServices: 0,
    totalVehicles: 0,
    monthlyRevenue: 0,
    lowStockAlerts: 0
  })
  const [recentServices, setRecentServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const [todayCount, vehiclesCount, monthlyRevenue, lowStock, recent] = await Promise.all([
        api.get('/oil-changes/today-count'),
        api.get('/vehicles/count'),
        api.get('/oil-changes/monthly-revenue'),
        api.get('/inventory/low-stock'),
        api.get('/oil-changes/recent?limit=5')
      ])

      setStats({
        todayServices: todayCount.data.data.count,
        totalVehicles: vehiclesCount.data.data.count,
        monthlyRevenue: monthlyRevenue.data.data.revenue,
        lowStockAlerts: lowStock.data.data.length
      })

      setRecentServices(recent.data.data)
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
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Services"
          value={stats.todayServices}
          icon={Wrench}
          description={stats.todayServices > 0 ? "Services completed today" : "No services yet"}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles}
          icon={Car}
          description={stats.totalVehicles > 0 ? "Registered vehicles" : "No vehicles yet"}
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="This month"
          isLoading={isLoading}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockAlerts}
          icon={AlertCircle}
          description={stats.lowStockAlerts > 0 ? "Items need reorder" : "All items in stock"}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Services</CardTitle>
            <CardDescription>Monthly performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" name="Revenue ($)" />
                <Bar dataKey="services" fill="var(--color-chart-2)" name="Services" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oil Types Used</CardTitle>
            <CardDescription>This month</CardDescription>
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
          <CardTitle>Services Trend</CardTitle>
          <CardDescription>Daily service volume over the past month</CardDescription>
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
                name="Services"
                dot={{ fill: 'var(--color-primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Services</CardTitle>
          <CardDescription>Latest oil change services</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentServices.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No recent services</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Vehicle</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Oil Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
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
                      <td className="py-3 px-4 text-foreground font-semibold">${service.price}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {new Date(service.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
