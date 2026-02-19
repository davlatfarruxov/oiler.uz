'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, ArrowUpDown, Filter } from 'lucide-react'
import { useState } from 'react'

interface Transaction {
  _id: string
  type: 'service' | 'payment'
  date: string
  amount: number
  balance: number
  // Service fields
  amountDue?: number
  paymentStatus?: string
  mileage?: number
  // Payment fields
  paymentMethod?: string
  notes?: string
  oilChange?: any
}

interface PaymentHistoryTableProps {
  transactions: Transaction[]
  onExport?: () => void
}

export function PaymentHistoryTable({ transactions, onExport }: PaymentHistoryTableProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<'all' | 'service' | 'payment'>('all')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all')

  // Apply filters
  let filteredTransactions = [...transactions]
  
  if (filterType !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === filterType)
  }
  
  if (filterPaymentStatus !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => 
      t.type === 'service' && t.paymentStatus === filterPaymentStatus
    )
  }

  // Apply sorting
  const sortedTransactions = filteredTransactions.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  const resetFilters = () => {
    setFilterType('all')
    setFilterPaymentStatus('all')
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['Sana', 'Turi', 'Tafsilot', 'Summa', 'Balans']
    const rows = sortedTransactions.map(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      const type = transaction.type === 'service' ? 'Xizmat' : 'To\'lov'
      
      let details = ''
      if (transaction.type === 'service') {
        details = `Mileage: ${transaction.mileage ? transaction.mileage.toLocaleString() : '0'} km`
        if (transaction.paymentStatus) {
          const status = transaction.paymentStatus === 'paid' ? 'To\'langan' : 
                        transaction.paymentStatus === 'partial' ? 'Qisman' : 
                        'To\'lanmagan'
          details += ` - ${status}`
        }
      } else {
        const method = transaction.paymentMethod === 'cash' ? 'Naqd' :
                      transaction.paymentMethod === 'card' ? 'Karta' :
                      transaction.paymentMethod === 'transfer' ? 'O\'tkazma' :
                      transaction.paymentMethod || ''
        details = method
        if (transaction.notes) {
          details += ` - ${transaction.notes}`
        }
      }
      
      const amount = `${transaction.type === 'service' ? '+' : '-'}${(transaction.amount || 0).toLocaleString()}`
      const balance = (transaction.balance || 0).toLocaleString()
      
      return [date, type, details, amount, balance]
    })

    // Create CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `payment-history-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Hali to'lov tarixi yo'q</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold">To'lov tarixi</h3>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Filter by Type */}
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Turi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="service">Xizmat</SelectItem>
              <SelectItem value="payment">To'lov</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter by Payment Status */}
          <Select value={filterPaymentStatus} onValueChange={(value: any) => setFilterPaymentStatus(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="To'lov holati" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="paid">To'langan</SelectItem>
              <SelectItem value="partial">Qisman</SelectItem>
              <SelectItem value="unpaid">To'lanmagan</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {(filterType !== 'all' || filterPaymentStatus !== 'all') && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Tozalash
            </Button>
          )}

          {/* Export Button */}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          
          {/* Default Export Button */}
          {!onExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={toggleSort} className="h-8 px-2">
                  Sana
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Tafsilot</TableHead>
              <TableHead className="text-right">Summa</TableHead>
              <TableHead className="text-right">Balans</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Filtrga mos ma'lumot topilmadi
                </TableCell>
              </TableRow>
            ) : (
              sortedTransactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell className="font-medium">
                    {new Date(transaction.date).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'service' ? (
                      <Badge variant="secondary">Xizmat</Badge>
                    ) : (
                      <Badge variant="default">To'lov</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'service' ? (
                      <div className="space-y-1">
                        <div className="text-sm">
                          Mileage: {transaction.mileage ? transaction.mileage.toLocaleString() : '0'} km
                        </div>
                        {transaction.paymentStatus && (
                          <Badge 
                            variant={
                              transaction.paymentStatus === 'paid' ? 'default' : 
                              transaction.paymentStatus === 'partial' ? 'secondary' : 
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {transaction.paymentStatus === 'paid' ? 'To\'langan' : 
                             transaction.paymentStatus === 'partial' ? 'Qisman' : 
                             'To\'lanmagan'}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-sm capitalize">
                          {transaction.paymentMethod === 'cash' ? 'Naqd' :
                           transaction.paymentMethod === 'card' ? 'Karta' :
                           transaction.paymentMethod === 'transfer' ? 'O\'tkazma' :
                           transaction.paymentMethod}
                        </div>
                        {transaction.notes && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.type === 'service' ? 'text-red-600' : 'text-green-600'}>
                      {transaction.type === 'service' ? '+' : '-'}
                      {(transaction.amount || 0).toLocaleString()} so'm
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {(transaction.balance || 0).toLocaleString()} so'm
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground text-right">
        Ko'rsatilmoqda: {sortedTransactions.length} / {transactions.length} ta operatsiya
      </div>
    </div>
  )
}
