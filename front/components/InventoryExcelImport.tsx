'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react'
import api from '@/lib/api/axios'

interface ImportRow {
  name: string
  price: number
  stock: number
  reorderLevel: number
  costPrice: number
  costCurrency: 'UZS' | 'USD'
  productType: 'other'
  _valid: boolean
  _errors: string[]
}

interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; name: string; reason: string }[]
}

// ─── Template yuklab olish ───────────────────────────────────────────────────
export function downloadInventoryTemplate() {
  const wb = XLSX.utils.book_new()
  const headers = ['Nomi *', 'Sotish narxi (UZS) *', 'Omborda *', 'Qayta buyurtma darajasi', 'Xarid narxi', 'Valyuta (UZS/USD)']
  const sample = ['Windshield wiper', 45000, 30, 10, 35000, 'UZS']
  const ws = XLSX.utils.aoa_to_sheet([headers, sample])
  ws['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 26 }, { wch: 14 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Mahsulotlar')
  XLSX.writeFile(wb, 'inventar-shablon.xlsx')
}

// ─── Export ──────────────────────────────────────────────────────────────────
export function exportInventoryToExcel(items: any[]) {
  const wb = XLSX.utils.book_new()
  const rows = [
    ['Nomi', 'Sotish narxi (UZS)', 'Omborda', 'Qayta buyurtma darajasi', 'Xarid narxi', 'Valyuta', 'Holat'],
    ...items.map((item) => [
      item.name,
      item.price,
      item.stock,
      item.reorderLevel,
      item.costPrice || '',
      item.costCurrency || 'UZS',
      item.stock <= item.reorderLevel ? 'Kam qoldi' : 'Yetarli',
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Ombor')
  XLSX.writeFile(wb, `inventar-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ─── Row validator ────────────────────────────────────────────────────────────
function parseRow(raw: Record<string, unknown>): ImportRow {
  const errors: string[] = []

  const name = String(raw['Nomi *'] ?? raw['Nomi'] ?? '').trim()
  if (!name) errors.push('Nomi bo\'sh')

  const price = Number(raw['Sotish narxi (UZS) *'] ?? raw['Sotish narxi (UZS)'] ?? 0)
  if (!price || price <= 0) errors.push('Sotish narxi noto\'g\'ri')

  const stock = Number(raw['Omborda *'] ?? raw['Omborda'] ?? 0)
  if (isNaN(stock) || stock < 0) errors.push('Omborda soni noto\'g\'ri')

  const reorderLevel = Number(raw['Qayta buyurtma darajasi'] ?? 10)
  const costPrice = Number(raw['Xarid narxi'] ?? 0)
  const rawCurrency = String(raw['Valyuta (UZS/USD)'] ?? raw['Valyuta'] ?? 'UZS').toUpperCase().trim()
  const costCurrency: 'UZS' | 'USD' = rawCurrency === 'USD' ? 'USD' : 'UZS'

  return {
    name,
    price,
    stock,
    reorderLevel: isNaN(reorderLevel) ? 10 : reorderLevel,
    costPrice: isNaN(costPrice) ? 0 : costPrice,
    costCurrency,
    productType: 'other',
    _valid: errors.length === 0,
    _errors: errors,
  }
}

// ─── Dialog ───────────────────────────────────────────────────────────────────
interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

export function InventoryExcelImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const reset = () => {
    setRows([])
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

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
      setRows(json.map(parseRow))
    }
    reader.readAsArrayBuffer(file)
  }

  const validRows = rows.filter((r) => r._valid)
  const invalidRows = rows.filter((r) => !r._valid)

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    try {
      const items = validRows.map(({ _valid, _errors, ...rest }) => rest)
      const res = await api.post('/inventory/bulk-import', { items })
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Excel orqali import</DialogTitle>
          <DialogDescription>
            Faylni yuklang, ko'rib chiqing va tasdiqlang. Bir xil nomli mahsulotlar o'tkazib yuboriladi.
          </DialogDescription>
        </DialogHeader>

        {/* Tugmalar satri */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadInventoryTemplate}>
            <Download className="w-4 h-4 mr-1" />
            Shablon yuklab olish
          </Button>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" />
            Excel fayl tanlash
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Import natijasi */}
        {result && (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-semibold">Import yakunlandi</p>
            <div className="flex gap-3 flex-wrap">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="w-3 h-3" /> {result.created} ta qo'shildi
              </Badge>
              {result.skipped > 0 && (
                <Badge variant="secondary">{result.skipped} ta o'tkazib yuborildi (takror)</Badge>
              )}
              {result.errors.length > 0 && (
                <Badge variant="destructive">{result.errors.length} ta xato</Badge>
              )}
            </div>
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-destructive">{e.row > 0 ? `${e.row}-qator` : ''} {e.name}: {e.reason}</p>
            ))}
          </div>
        )}

        {/* Preview jadval */}
        {rows.length > 0 && !result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{rows.length} ta qator topildi</span>
              {invalidRows.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <X className="w-3 h-3" /> {invalidRows.length} ta xato
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
                <CheckCircle className="w-3 h-3" /> {validRows.length} ta to'g'ri
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Nomi</th>
                    <th className="px-3 py-2 text-left font-medium">Sotish narxi</th>
                    <th className="px-3 py-2 text-left font-medium">Omborda</th>
                    <th className="px-3 py-2 text-left font-medium">Xarid narxi</th>
                    <th className="px-3 py-2 text-left font-medium">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-t ${row._valid ? '' : 'bg-red-50 dark:bg-red-950/20'}`}>
                      <td className="px-3 py-2 text-muted-foreground">{i + 2}</td>
                      <td className="px-3 py-2 font-medium">{row.name || '—'}</td>
                      <td className="px-3 py-2">{row.price?.toLocaleString()} UZS</td>
                      <td className="px-3 py-2">{row.stock}</td>
                      <td className="px-3 py-2">
                        {row.costPrice ? `${row.costPrice.toLocaleString()} ${row.costCurrency}` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row._valid ? (
                          <Badge variant="outline" className="text-green-700 border-green-300 text-xs">OK</Badge>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            {row._errors.join(', ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Bekor qilish</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0 || importing}>
                {importing ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Yuklanmoqda...</>
                ) : (
                  `${validRows.length} ta mahsulotni import qilish`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
