'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react'
import api from '@/lib/api/axios'

const FILTER_TYPE_MAP: Record<string, string> = {
  'moy filteri': 'oil_filter',
  'oil filter': 'oil_filter',
  'oil_filter': 'oil_filter',
  'havo filteri': 'air_filter',
  'air filter': 'air_filter',
  'air_filter': 'air_filter',
  'salon filteri': 'cabin_filter',
  'cabin filter': 'cabin_filter',
  'cabin_filter': 'cabin_filter',
  "yoqilg'i filteri": 'fuel_filter',
  'fuel filter': 'fuel_filter',
  'fuel_filter': 'fuel_filter',
}

const FILTER_TYPE_LABELS: Record<string, string> = {
  oil_filter: 'Moy filteri',
  air_filter: 'Havo filteri',
  cabin_filter: 'Salon filteri',
  fuel_filter: "Yoqilg'i filteri",
}

interface ImportRow {
  brandName: string
  filterType: string
  partNumber: string
  quality: string
  compatibleVehicles: string[]
  costPrice: number
  costCurrency: 'UZS' | 'USD'
  price: number
  stock: number
  reorderLevel: number
  _valid: boolean
  _errors: string[]
}

interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; name: string; reason: string }[]
}

export function downloadFiltersTemplate() {
  const wb = XLSX.utils.book_new()
  const headers = [
    'Brend nomi *',
    'Filter turi *',
    'Qism raqami *',
    'Sifat *',
    'Mos mashinalar',
    'Xarid narxi *',
    'Valyuta (UZS/USD)',
    'Sotish narxi (UZS) *',
    'Omborda *',
    'Qayta buyurtma darajasi',
  ]
  const sample = ['Mann', 'Moy filteri', 'W 712/75', 'Premium', 'Toyota Camry, Honda Accord', 15000, 'UZS', 25000, 50, 10]
  const ws = XLSX.utils.aoa_to_sheet([headers, sample])
  ws['!cols'] = headers.map(() => ({ wch: 22 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Filterlar')
  XLSX.writeFile(wb, 'filterlar-shablon.xlsx')
}

export function exportFiltersToExcel(filters: any[]) {
  const wb = XLSX.utils.book_new()
  const rows = [
    ['Brend nomi', 'Filter turi', 'Qism raqami', 'Sifat', 'Mos mashinalar', 'Xarid narxi', 'Valyuta', 'Sotish narxi (UZS)', 'Omborda', 'Qayta buyurtma darajasi', 'Holat'],
    ...filters.map((f) => [
      f.brandName,
      FILTER_TYPE_LABELS[f.filterType] ?? f.filterType,
      f.partNumber,
      f.quality,
      (f.compatibleVehicles ?? []).join(', '),
      f.costPrice ?? '',
      f.costCurrency ?? 'UZS',
      f.price,
      f.stock,
      f.reorderLevel,
      f.stock <= f.reorderLevel ? 'Kam qoldi' : 'Yetarli',
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = rows[0].map(() => ({ wch: 20 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Filterlar')
  XLSX.writeFile(wb, `filterlar-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function parseFilterRow(raw: Record<string, unknown>, idx: number): ImportRow {
  const errors: string[] = []

  const brandName = String(raw['Brend nomi *'] ?? raw['Brend nomi'] ?? '').trim()
  if (!brandName) errors.push('Brend nomi bo\'sh')

  const rawType = String(raw['Filter turi *'] ?? raw['Filter turi'] ?? '').trim().toLowerCase()
  const filterType = FILTER_TYPE_MAP[rawType] ?? ''
  if (!filterType) errors.push(`Filter turi noto'g'ri: "${rawType}"`)

  const partNumber = String(raw['Qism raqami *'] ?? raw['Qism raqami'] ?? '').trim()
  if (!partNumber) errors.push('Qism raqami bo\'sh')

  const quality = String(raw['Sifat *'] ?? raw['Sifat'] ?? '').trim()
  if (!quality) errors.push('Sifat bo\'sh')

  const price = Number(raw['Sotish narxi (UZS) *'] ?? raw['Sotish narxi (UZS)'] ?? 0)
  if (!price || price <= 0) errors.push('Sotish narxi noto\'g\'ri')

  const stock = Number(raw['Omborda *'] ?? raw['Omborda'] ?? 0)
  if (isNaN(stock) || stock < 0) errors.push('Omborda soni noto\'g\'ri')

  const costVehicles = String(raw['Mos mashinalar'] ?? '').trim()
  const compatibleVehicles = costVehicles ? costVehicles.split(',').map((v) => v.trim()).filter(Boolean) : []
  const costPrice = Number(raw['Xarid narxi *'] ?? raw['Xarid narxi'] ?? 0)
  const rawCurrency = String(raw['Valyuta (UZS/USD)'] ?? raw['Valyuta'] ?? 'UZS').toUpperCase().trim()
  const costCurrency: 'UZS' | 'USD' = rawCurrency === 'USD' ? 'USD' : 'UZS'
  const reorderLevel = Number(raw['Qayta buyurtma darajasi'] ?? 10)

  return {
    brandName, filterType, partNumber, quality, compatibleVehicles,
    costPrice: isNaN(costPrice) ? 0 : costPrice,
    costCurrency, price, stock,
    reorderLevel: isNaN(reorderLevel) ? 10 : reorderLevel,
    _valid: errors.length === 0,
    _errors: errors,
  }
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

export function FiltersExcelImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const reset = () => { setRows([]); setResult(null); if (fileRef.current) fileRef.current.value = '' }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
      setRows(json.map((r, i) => parseFilterRow(r, i)))
    }
    reader.readAsArrayBuffer(file)
  }

  const validRows = rows.filter((r) => r._valid)

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    try {
      const items = validRows.map(({ _valid, _errors, ...rest }) => rest)
      const res = await api.post('/filters/bulk-import', { items })
      setResult(res.data.data)
      onSuccess()
    } catch (err: any) {
      setResult({ created: 0, skipped: 0, errors: [{ row: 0, name: '', reason: err?.response?.data?.message || 'Server xatoligi' }] })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filterlar — Excel import</DialogTitle>
          <DialogDescription>Shablon yuklab, to'ldirib import qiling. Bir xil brend+tur+raqam bo'lgan filterlar o'tkazib yuboriladi.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadFiltersTemplate}>
            <Download className="w-4 h-4 mr-1" />Shablon yuklab olish
          </Button>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" />Excel fayl tanlash
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        </div>

        {result && (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-semibold">Import yakunlandi</p>
            <div className="flex gap-3 flex-wrap">
              <Badge className="gap-1"><CheckCircle className="w-3 h-3" /> {result.created} ta qo'shildi</Badge>
              {result.skipped > 0 && <Badge variant="secondary">{result.skipped} ta o'tkazib yuborildi</Badge>}
              {result.errors.length > 0 && <Badge variant="destructive">{result.errors.length} ta xato</Badge>}
            </div>
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-destructive">{e.row > 0 ? `${e.row}-qator` : ''} {e.name}: {e.reason}</p>
            ))}
          </div>
        )}

        {rows.length > 0 && !result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{rows.length} ta qator</span>
              {rows.filter(r => !r._valid).length > 0 && (
                <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />{rows.filter(r => !r._valid).length} xato</Badge>
              )}
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
                <CheckCircle className="w-3 h-3" />{validRows.length} to'g'ri
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['#', 'Brend', 'Tur', 'Raqam', 'Sifat', 'Narx', 'Omborda', 'Holat'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-t ${row._valid ? '' : 'bg-red-50 dark:bg-red-950/20'}`}>
                      <td className="px-3 py-2 text-muted-foreground">{i + 2}</td>
                      <td className="px-3 py-2 font-medium">{row.brandName || '—'}</td>
                      <td className="px-3 py-2">{(FILTER_TYPE_LABELS[row.filterType] ?? row.filterType) || '—'}</td>
                      <td className="px-3 py-2">{row.partNumber || '—'}</td>
                      <td className="px-3 py-2">{row.quality || '—'}</td>
                      <td className="px-3 py-2">{row.price?.toLocaleString()} UZS</td>
                      <td className="px-3 py-2">{row.stock}</td>
                      <td className="px-3 py-2">
                        {row._valid
                          ? <Badge variant="outline" className="text-green-700 border-green-300 text-xs">OK</Badge>
                          : <span className="flex items-center gap-1 text-destructive text-xs"><AlertTriangle className="w-3 h-3" />{row._errors.join(', ')}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Bekor qilish</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0 || importing}>
                {importing
                  ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Yuklanmoqda...</>
                  : `${validRows.length} ta filterni import qilish`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
