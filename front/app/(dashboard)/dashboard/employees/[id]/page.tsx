'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, User, Phone, Mail, Calendar, DollarSign, Briefcase, Download, CreditCard, ChevronDown, ChevronUp } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils/dateFormat'

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [paymentSummary, setPaymentSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [activeTab, setActiveTab] = useState<'services' | 'payments'>('services')
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  
  // Filters
  const [serviceType, setServiceType] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    fetchEmployeeData()
    fetchPaymentSummary()
    fetchCompanySettings()
  }, [params.id])

  const fetchCompanySettings = async () => {
    try {
      const response = await api.get('/settings')
      setCompanySettings(response.data.data)
    } catch (error) {
      console.error('Failed to load company settings:', error)
    }
  }

  useEffect(() => {
    if (employee && activeTab === 'payments') {
      fetchPayments()
    }
  }, [activeTab, paymentsPage])

  const fetchEmployeeData = async () => {
    try {
      setIsLoading(true)
      const [employeeRes, statsRes] = await Promise.all([
        api.get(`/employees/${params.id}`),
        api.get(`/employees/${params.id}/statistics`)
      ])
      
      console.log('Employee data:', employeeRes.data)
      console.log('Statistics data:', statsRes.data)
      
      setEmployee(employeeRes.data.data)
      setStatistics(statsRes.data.data)
    } catch (error) {
      console.error('Failed to load employee:', error)
      alert('Xodimni yuklashda xatolik')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      setIsLoadingServices(true)
      const queryParams: any = {
        page: currentPage,
        limit: 20
      }
      
      if (serviceType !== 'all') queryParams.serviceType = serviceType
      if (paymentStatus !== 'all') queryParams.paymentStatus = paymentStatus
      if (startDate) queryParams.startDate = startDate
      if (endDate) queryParams.endDate = endDate

      console.log('Fetching services with params:', queryParams)
      const response = await api.get(`/employees/${params.id}/services`, { params: queryParams })
      console.log('Services response:', response.data)
      const data = response.data.data
      
      console.log('Services array:', data.services)
      console.log('Services length:', data.services?.length)
      
      // Check commission rate
      if (data.services && data.services.length > 0) {
        console.log('First service commission rate:', data.services[0].commissionRate)
      }
      
      setServices(data.services || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setSummary(data.summary)
    } catch (error) {
      console.error('Failed to load services:', error)
    } finally {
      setIsLoadingServices(false)
    }
  }

  useEffect(() => {
    if (employee) {
      fetchServices()
    }
  }, [employee, serviceType, paymentStatus, startDate, endDate, currentPage])

  const fetchPayments = async () => {
    try {
      setIsLoadingPayments(true)
      const response = await api.get(`/employee-payments/employee/${params.id}`, {
        params: {
          page: paymentsPage,
          limit: 20
        }
      })
      const data = response.data.data
      setPayments(data.payments || [])
      setPaymentsTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const fetchPaymentSummary = async () => {
    try {
      const response = await api.get(`/employee-payments/employee/${params.id}/summary`)
      setPaymentSummary(response.data.data)
    } catch (error) {
      console.error('Failed to load payment summary:', error)
    }
  }

  const handlePayEmployee = async () => {
    const cleanAmount = paymentAmount.replace(/\s/g, '');
    if (!cleanAmount || parseFloat(cleanAmount) <= 0) {
      alert('To\'lov summasini kiriting')
      return
    }

    try {
      setIsSavingPayment(true)
      await api.post('/employee-payments', {
        employeeId: params.id,
        amount: parseFloat(cleanAmount),
        paymentMethod,
        notes: paymentNotes
      })

      alert('To\'lov muvaffaqiyatli amalga oshirildi')
      setShowPaymentDialog(false)
      setPaymentAmount('')
      setPaymentNotes('')
      fetchPaymentSummary()
      fetchEmployeeData()
      if (activeTab === 'payments') {
        fetchPayments()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'To\'lov amalga oshirishda xatolik')
    } finally {
      setIsSavingPayment(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      // Get date range
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      const end = endDate || new Date().toISOString().split('T')[0]
      
      // Fetch all services for the period
      const response = await api.get(`/employees/${params.id}/services`, {
        params: {
          startDate: start,
          endDate: end,
          serviceType,
          paymentStatus,
          page: 1,
          limit: 1000 // Get all for PDF
        }
      })
      
      const data = response.data.data
      
      // Generate PDF content
      generatePDF(data, start, end)
    } catch (error) {
      console.error('PDF export error:', error)
      alert('PDF yaratishda xatolik yuz berdi')
    }
  }

  const generatePDF = (data: any, startDate: string, endDate: string) => {
    // Create print window
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Pop-up blocker faol. Iltimos, ruxsat bering.')
      return
    }

    const services = data.services || []
    const summary = data.summary || {}
    
    // Group by service type
    const oilChanges = services.filter((s: any) => s.type === 'oilChange')
    const generalServices = services.filter((s: any) => s.type === 'service')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Oylik Hisobot - ${employee?.name}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .report-title {
            font-size: 18px;
            color: #666;
            margin-top: 10px;
          }
          .employee-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin: 25px 0 15px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          th {
            background: #333;
            color: white;
            padding: 10px;
            text-align: left;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          tr:hover { background: #f9f9f9; }
          .summary-box {
            background: #f0f9ff;
            border: 2px solid #0284c7;
            padding: 20px;
            border-radius: 5px;
            margin: 30px 0;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .summary-row.total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #0284c7;
            padding-top: 10px;
            margin-top: 10px;
          }
          .signature {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin-top: 50px;
            padding-top: 5px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companySettings?.companyName || 'Kompaniya'}</div>
          <div class="report-title">XODIM OYLIK HISOBOTI</div>
          <div style="margin-top: 10px; color: #666;">
            Davr: ${new Date(startDate).toLocaleDateString('uz-UZ')} - ${new Date(endDate).toLocaleDateString('uz-UZ')}
          </div>
        </div>

        <div class="employee-info">
          <div class="info-row">
            <strong>Xodim:</strong>
            <span>${employee?.name}</span>
          </div>
          <div class="info-row">
            <strong>Telefon:</strong>
            <span>${employee?.phone}</span>
          </div>
          <div class="info-row">
            <strong>Email:</strong>
            <span>${employee?.email}</span>
          </div>
          <div class="info-row">
            <strong>Komissiya stavkasi:</strong>
            <span>${statistics?.commissionRate || 30}%</span>
          </div>
        </div>

        ${oilChanges.length > 0 ? `
        <div class="section-title">MOY ALMASHTIRISH XIZMATLARI (${oilChanges.length} ta)</div>
        <table>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Mashina</th>
              <th>Mijoz</th>
              <th>Narx</th>
              <th>Komissiya</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            ${oilChanges.map((s: any) => `
              <tr>
                <td>${new Date(s.date).toLocaleDateString('uz-UZ')}</td>
                <td>${s.vehicle?.plateNumber || 'N/A'}</td>
                <td>${s.customer?.name || 'N/A'}</td>
                <td>${(s.price || 0).toLocaleString()} so'm</td>
                <td style="color: green; font-weight: bold;">${(s.commission || 0).toLocaleString()} so'm</td>
                <td>${s.paymentStatus === 'paid' ? 'To\'langan' : s.paymentStatus === 'partial' ? 'Qisman' : 'To\'lanmagan'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${generalServices.length > 0 ? `
        <div class="section-title">ISH SESSIYALARI (${generalServices.length} ta)</div>
        <table>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Mashina</th>
              <th>Mijoz</th>
              <th>Narx</th>
              <th>Komissiya</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            ${generalServices.map((s: any) => `
              <tr>
                <td>${new Date(s.date).toLocaleDateString('uz-UZ')}</td>
                <td>${s.vehicle?.plateNumber || 'N/A'}</td>
                <td>${s.customer?.name || 'N/A'}</td>
                <td>${(s.price || 0).toLocaleString()} so'm</td>
                <td style="color: green; font-weight: bold;">${(s.commission || 0).toLocaleString()} so'm</td>
                <td>${s.paymentStatus === 'paid' ? 'To\'langan' : s.paymentStatus === 'partial' ? 'Qisman' : 'To\'lanmagan'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="summary-box">
          <div class="summary-row">
            <span>Jami xizmatlar:</span>
            <strong>${summary.totalServices || 0} ta</strong>
          </div>
          <div class="summary-row">
            <span>Moy almashtirish:</span>
            <strong>${oilChanges.length} ta</strong>
          </div>
          <div class="summary-row">
            <span>Ish sessiyalari:</span>
            <strong>${generalServices.length} ta</strong>
          </div>
          <div class="summary-row">
            <span>Jami summa:</span>
            <strong>${(summary.totalRevenue || 0).toLocaleString()} so'm</strong>
          </div>
          <div class="summary-row total">
            <span>JAMI KOMISSIYA:</span>
            <strong style="color: green;">${(summary.totalCommission || 0).toLocaleString()} so'm</strong>
          </div>
        </div>

        <div class="signature">
          <div class="signature-box">
            <div>Rahbar</div>
            <div class="signature-line">_________________</div>
          </div>
          <div class="signature-box">
            <div>Xodim</div>
            <div class="signature-line">_________________</div>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
            Chop etish
          </button>
          <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; margin-left: 10px;">
            Yopish
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!employee) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{employee.name}</h1>
            <p className="text-muted-foreground mt-1">{employee.email}</p>
          </div>
        </div>
        <Button onClick={handleExportPDF} className="gap-2">
          <Download className="w-4 h-4" />
          PDF yuklab olish
        </Button>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Xodim ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ism</p>
                <p className="font-semibold">{employee.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-semibold">{employee.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold text-sm">{employee.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ish boshlagan</p>
                <p className="font-semibold">
                  {employee.startDate ? formatDate(employee.startDate) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jami xizmatlar</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {statistics.allTime?.totalServices || 0}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bu oyda</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {statistics.thisMonth?.totalServices || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">To'langan</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {(paymentSummary?.allTime?.totalPaid || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">so'm</p>
                </div>
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/50 dark:border-orange-700/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Qarz (berish kerak)</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                    {((statistics.allTime?.totalCommission || 0) - (paymentSummary?.allTime?.totalPaid || 0)).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">so'm</p>
                </div>
                <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Action Card */}
      {statistics && paymentSummary && (
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20 dark:border-green-700/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Xodimga to'lov qilish</h3>
                <p className="text-sm text-muted-foreground">
                  Bu oyda: {(statistics.thisMonth?.totalCommission || 0).toLocaleString()} so'm komissiya
                </p>
                <p className="text-sm text-muted-foreground">
                  To'langan: {(paymentSummary.thisMonth?.totalPaid || 0).toLocaleString()} so'm
                </p>
              </div>
              <Button onClick={() => setShowPaymentDialog(true)} className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                <CreditCard className="w-4 h-4" />
                To'lov qilish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Services History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Xizmatlar va To'lovlar</CardTitle>
              <CardDescription>Barcha ma'lumotlar</CardDescription>
            </div>
            {/* Tabs */}
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'services' ? 'default' : 'outline'}
                onClick={() => setActiveTab('services')}
              >
                Xizmatlar tarixi
              </Button>
              <Button
                variant={activeTab === 'payments' ? 'default' : 'outline'}
                onClick={() => setActiveTab('payments')}
              >
                To'lovlar tarixi
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'services' && (
            <>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label>Xizmat turi</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      <SelectItem value="oilChange">Moy almashtirish</SelectItem>
                      <SelectItem value="service">Ish sessiyasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>To'lov holati</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      <SelectItem value="paid">To'langan</SelectItem>
                      <SelectItem value="partial">Qisman</SelectItem>
                      <SelectItem value="unpaid">To'lanmagan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Boshlanish sanasi</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Tugash sanasi</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Summary */}
              {summary && (
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Jami xizmatlar</p>
                    <p className="text-lg font-bold text-foreground">{summary.totalServices || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jami summa</p>
                    <p className="text-lg font-bold text-foreground">{(summary.totalRevenue || 0).toLocaleString()} so'm</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jami komissiya</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {(summary.totalCommission || 0).toLocaleString()} so'm
                    </p>
                  </div>
                </div>
              )}

              {/* Services Table */}
              {isLoadingServices ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Xizmatlar topilmadi
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Sana</th>
                          <th className="text-left p-3">Mashina</th>
                          <th className="text-left p-3">Mijoz</th>
                          <th className="text-left p-3">Xizmat</th>
                          <th className="text-right p-3">Komissiya</th>
                          <th className="text-center p-3">To'lov holati</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <>
                            <tr key={service._id} className="border-t hover:bg-muted/50">
                              <td className="p-3">{formatDate(service.date)}</td>
                              <td className="p-3 font-medium">
                                {service.vehicle?.plateNumber || 'N/A'}
                              </td>
                              <td className="p-3">{service.customer?.name || 'N/A'}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {service.type === 'oilChange' ? (
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                      Moy almashtirish
                                    </Badge>
                                  ) : (
                                    <>
                                      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                        Ish sessiyasi ({service.employeeServiceCount} ta)
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedServiceId(
                                          expandedServiceId === service._id ? null : service._id
                                        )}
                                      >
                                        {expandedServiceId === service._id ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    {(service.commission || 0).toLocaleString()} so'm
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {service.type === 'oilChange' 
                                      ? `(${service.commissionRate || 30}%)`
                                      : 'Umumiy'
                                    }
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                {service.paymentStatus === 'paid' && (
                                  <Badge className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">To'langan</Badge>
                                )}
                                {service.paymentStatus === 'partial' && (
                                  <div className="flex flex-col items-center gap-1">
                                    <Badge variant="secondary">Qisman</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {(service.amountPaid || 0).toLocaleString()} so'm to'langan
                                    </span>
                                  </div>
                                )}
                                {service.paymentStatus === 'unpaid' && (
                                  <Badge variant="destructive">To'lanmagan</Badge>
                                )}
                              </td>
                            </tr>
                            
                            {/* Expanded service details */}
                            {expandedServiceId === service._id && service.type === 'service' && service.services && (
                              <tr key={`${service._id}-details`}>
                                <td colSpan={6} className="p-0">
                                  <div className="bg-muted/30 dark:bg-muted/20 p-4">
                                    <h4 className="font-semibold mb-3 text-sm text-foreground">Xizmat tafsilotlari:</h4>
                                    <div className="space-y-2">
                                      {service.services
                                        .filter((s: any) => s.employees.some((e: any) => 
                                          (typeof e === 'string' ? e : e._id?.toString()) === params.id
                                        ))
                                        .map((s: any, idx: number) => {
                                          const employeeCommissionRecord = (s.employeeCommissions || []).find((commission: any) => {
                                            const employeeCommissionId =
                                              typeof commission.employee === 'string'
                                                ? commission.employee
                                                : commission.employee?._id?.toString?.() || commission.employee?.toString?.();
                                            return employeeCommissionId === params.id;
                                          });
                                          const employeeCommission = employeeCommissionRecord?.commissionAmount || 0;
                                          const employeeCommissionRate = employeeCommissionRecord?.commissionRate || 0;
                                          
                                          return (
                                            <div key={idx} className="flex justify-between items-center bg-background dark:bg-card p-3 rounded border border-border">
                                              <div>
                                                <p className="font-medium text-sm text-foreground">{s.serviceName}</p>
                                              </div>
                                              <div className="text-right">
                                                <p className="font-semibold text-green-600 dark:text-green-400">
                                                  {Math.round(employeeCommission).toLocaleString()} so'm
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  Komissiya ({employeeCommissionRate}%)
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      
                                      {/* Total commission */}
                                      <div className="flex justify-between items-center bg-green-50 dark:bg-green-950/30 p-3 rounded border-2 border-green-200 dark:border-green-800 mt-3">
                                        <p className="font-semibold text-sm text-foreground">Jami komissiya:</p>
                                        <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                                          {(service.commission || 0).toLocaleString()} so'm
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Sahifa {currentPage} / {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Oldingi
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Keyingi
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          
          {activeTab === 'payments' && (
            <>
              {isLoadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Hali to'lovlar yo'q
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Sana</th>
                          <th className="text-left p-3">Summa</th>
                          <th className="text-left p-3">To'lov usuli</th>
                          <th className="text-left p-3">Izoh</th>
                          <th className="text-left p-3">Kim berdi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment: any) => (
                          <tr key={payment._id} className="border-t hover:bg-muted/50">
                            <td className="p-3">{formatDate(payment.paymentDate)}</td>
                            <td className="p-3">
                              <span className="font-semibold text-green-600 dark:text-green-400 text-lg">
                                {(payment.amount || 0).toLocaleString()} so'm
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">
                                {payment.paymentMethod === 'cash' ? 'Naqd' :
                                 payment.paymentMethod === 'card' ? 'Karta' :
                                 payment.paymentMethod === 'transfer' ? 'O\'tkazma' :
                                 payment.paymentMethod}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {payment.notes || '-'}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {payment.createdBy?.name || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {paymentsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Sahifa {paymentsPage} / {paymentsTotalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                          disabled={paymentsPage === 1}
                        >
                          Oldingi
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentsPage(p => Math.min(paymentsTotalPages, p + 1))}
                          disabled={paymentsPage === paymentsTotalPages}
                        >
                          Keyingi
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xodimga to'lov qilish</DialogTitle>
            <DialogDescription>
              {employee?.name} ga to'lov amalga oshiring
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jami komissiya:</span>
                <span className="font-semibold">{(statistics?.allTime?.totalCommission || 0).toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To'langan:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{(paymentSummary?.allTime?.totalPaid || 0).toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Qolgan qarz:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {((statistics?.allTime?.totalCommission || 0) - (paymentSummary?.allTime?.totalPaid || 0)).toLocaleString()} so'm
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="amount">To'lov summasi *</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={paymentAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  if (/^\d*$/.test(value)) {
                    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    setPaymentAmount(formatted);
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">To'lov usuli *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Naqd</SelectItem>
                  <SelectItem value="card">Karta</SelectItem>
                  <SelectItem value="transfer">O'tkazma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Izoh</Label>
              <Textarea
                id="notes"
                placeholder="Qo'shimcha ma'lumot..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handlePayEmployee} 
                className="flex-1"
                disabled={isSavingPayment}
              >
                {isSavingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  'To\'lov qilish'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                disabled={isSavingPayment}
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
