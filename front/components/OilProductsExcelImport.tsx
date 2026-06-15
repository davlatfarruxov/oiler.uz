'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react'
import api from '@/lib/api/axios'

interface ImportRow {
  brandName: string
  viscosity: string
  apiGrade: string
  volume: number
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

export function downloadOilProductsTemplate() {
  const wb = XLSX.utils.book_new()
  const headers = [
    'Brend nomi *',
    'Qovushqoqlik *',
    'API daraja *',
    'Hajm (L) *',
    'Xarid narxi *',
    'Valyuta (UZS/USD)',
    'Sotish narxi (UZS) *',
    'Omborda *',
    'Qayta buyurtma darajasi',
  ]
  const samples = [
    ['Mobil', '10W-40', 'SN', 4, 85000, 'UZS', 120000, 20, 5],
    ['Shell', '5W-30', 'SP', 4, 95000, 'UZS', 135000, 15, 5],
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...samples])
  ws['!cols'] = headers.map(() => ({ wch: 22 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Moy mahsulotlari')
  XLSX.writeFile(wb, 'moy-mahsulotlari-shablon.xlsx')
}

export function exportOilProductsToExcel(brands: any[], allProducts: any[]) {
  const wb = XLSX.utils.book_new()
  const rows = [
    ['Brend nomi', 'Qovushqoqlik', 'API daraja', 'Hajm (L)', 'Xarid narxi', 'Valyuta', 'Sotish narxi (UZS)', 'Omborda', 'Qayta buyurtma darajasi', 'Holat'],
    ...allProducts.map((p) => [
      p.brand ?? '',
      p.viscosity,
      p.apiGrade,
      p.volume,
      p.costPrice ?? '',
      p.costCurrency ?? 'UZS',
      p.price,
      p.stock,
      p.reorderLevel,
      p.stock <= p.reorderLevel ? 'Kam qoldi' : 'Yetarli',
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = rows[0].map(() => ({ wch: 20 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Moy mahsulotlari')
  XLSX.writeFile(wb, `moy-mahsulotlari-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function parseOilRow(raw: Record<string, unknown>): ImportRow {
  const errors: string[] = []

  const brandName = String(raw['Brend nomi *'] ?? raw['Brend nomi'] ?? '').trim()
  if (!brandName) errors.push('Brend nomi bo\'sh')

  const viscosity = String(raw['Qovushqoqlik *'] ?? raw['Qovushqoqlik'] ?? '').trim()
  if (!viscosity) errors.push('Qovushqoqlik bo\'sh')

  const apiGrade = String(raw['API daraja *'] ?? raw['API daraja'] ?? '').trim().toUpperCase()
  if (!apiGrade) errors.push('API daraja bo\'sh')

  const volume = Number(raw['Hajm (L) *'] ?? raw['Hajm (L)'] ?? 0)
  if (!volume || volume <= 0) errors.push('Hajm noto\'g\'ri')

  const price = Number(raw['Sotish narxi (UZS) *'] ?? raw['Sotish narxi (UZS)'] ?? 0)
  if (!price || price <= 0) errors.push('Sotish narxi noto\'g\'ri')

  const stock = Number(raw['Omborda *'] ?? raw['Omborda'] ?? 0)
  if (isNaN(stock) || stock < 0) errors.push('Omborda soni noto\'g\'ri')

  const costPrice = Number(raw['Xarid narxi *'] ?? raw['Xarid narxi'] ?? 0)
  const rawCurrency = String(raw['Valyuta (UZS/USD)'] ?? raw['Valyuta'] ?? 'UZS').toUpperCase().trim()
  const costCurrency: 'UZS' | 'USD' = rawCurrency === 'USD' ? 'USD' : 'UZS'
  const reorderLevel = Number(raw['Qayta buyurtma darajasi'] ?? 10)

  return {
    brandName, viscosity, apiGrade, volume,
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

export function OilProductsExcelImportDialog({ open, onOpenChange, onSuccess }: Props) {
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
      setRows(json.map(parseOilRow))
    }
    reader.readAsArrayBuffer(file)
  }

  const validRows = rows.filter((r) => r._valid)

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    try {
      const items = validRows.map(({ _valid, _errors, ...rest }) => rest)
      const res = await api.post('/oil-products/bulk-import', { items })
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
          <DialogTitle>Moy mahsulotlari — Excel import</DialogTitle>
          <DialogDescription>
            Shablon yuklab, to'ldirib import qiling. Brend mavjud bo'lmasa avtomatik yaratiladi. Bir xil brend+qovushqoqlik+API+hajm takrorlansa o'tkazib yuboriladi.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadOilProductsTemplate}>
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
                    {['#', 'Brend', 'Qovushqoqlik', 'API', 'Hajm', 'Narx', 'Omborda', 'Holat'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-t ${row._valid ? '' : 'bg-red-50 dark:bg-red-950/20'}`}>
                      <td className="px-3 py-2 text-muted-foreground">{i + 2}</td>
                      <td className="px-3 py-2 font-medium">{row.brandName || '—'}</td>
                      <td className="px-3 py-2">{row.viscosity || '—'}</td>
                      <td className="px-3 py-2">{row.apiGrade || '—'}</td>
                      <td className="px-3 py-2">{row.volume ? `${row.volume}L` : '—'}</td>
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
                  : `${validRows.length} ta mahsulotni import qilish`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
