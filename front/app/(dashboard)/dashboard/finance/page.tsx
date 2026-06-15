'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/lib/api/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, Package, AlertCircle, Plus, Pencil, Trash2,
  CalendarDays, Loader2, ArrowUpRight, ReceiptText, Banknote, ShoppingCart,
} from 'lucide-react'

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'rent', label: 'Ijara' },
  { value: 'utilities', label: 'Kommunal xizmatlar' },
  { value: 'equipment', label: 'Asbob-uskunalar' },
  { value: 'marketing', label: 'Reklama/Marketing' },
  { value: 'other', label: 'Boshqa' },
] as const

type CategoryValue = typeof CATEGORIES[number]['value']

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
)

const PERIODS = [
  { value: 'today', label: 'Bugun' },
  { value: 'week', label: 'Bu hafta' },
  { value: 'month', label: 'Bu oy' },
  { value: 'last_month', label: 'O\'tgan oy' },
  { value: 'year', label: 'Bu yil' },
  { value: 'custom', label: 'O\'z vaqti' },
]

function fmt(n: number) {
  return n.toLocaleString('uz-UZ')
}

function getPeriodDates(period: string): { startDate: string; endDate: string } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (period === 'today') {
    const s = iso(now)
    return { startDate: s, endDate: s }
  }
  if (period === 'week') {
    const day = now.getDay() || 7
    const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
    return { startDate: iso(mon), endDate: iso(now) }
  }
  if (period === 'month') {
    return { startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, endDate: iso(now) }
  }
  if (period === 'last_month') {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lme = new Date(now.getFullYear(), now.getMonth(), 0)
    return { startDate: iso(lm), endDate: iso(lme) }
  }
  if (period === 'year') {
    return { startDate: `${now.getFullYear()}-01-01`, endDate: iso(now) }
  }
  return { startDate: iso(now), endDate: iso(now) }
}

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface Summary {
  revenue: number
  commissionsPaid: number
  otherExpenses: number
  netProfit: number
  serviceCount: number
  unpaidAmount: number
}

interface ChartPoint {
  label: string
  revenue: number
  commissions: number
  otherExpenses: number
}

interface InventoryValue {
  costValue: number
  sellValue: number
}

interface Expense {
  _id: string
  date: string
  category: CategoryValue
  amount: number
  description: string
  createdBy?: { name: string }
}

const emptySummary: Summary = {
  revenue: 0, commissionsPaid: 0, otherExpenses: 0,
  netProfit: 0, serviceCount: 0, unpaidAmount: 0,
}

const emptyForm = { date: '', category: 'rent' as CategoryValue, amount: '', description: '' }

// ─────────────────────────────────────────────────────
// Custom Tooltip for chart
// ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg text-sm space-y-1">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)} so'm
        </p>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────
export default function FinancePage() {
  const [period, setPeriod] = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const [summary, setSummary] = useState<Summary>(emptySummary)
  const [chart, setChart] = useState<ChartPoint[]>([])
  const [inventoryValue, setInventoryValue] = useState<InventoryValue>({ costValue: 0, sellValue: 0 })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filterCategory, setFilterCategory] = useState('all')

  const [loading, setLoading] = useState(false)
  const [expensesLoading, setExpensesLoading] = useState(false)

  const [openDialog, setOpenDialog] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Compute active date range
  const activeDates =
    period === 'custom'
      ? { startDate: customStart, endDate: customEnd }
      : getPeriodDates(period)

  const fetchSummary = useCallback(async () => {
    if (period === 'custom' && (!customStart || !customEnd)) return
    setLoading(true)
    try {
      const params = new URLSearchParams(activeDates)
      const [sumRes, invRes] = await Promise.all([
        api.get(`/finance/summary?${params}`),
        api.get('/finance/inventory-value'),
      ])
      setSummary(sumRes.data.data ?? emptySummary)
      setInventoryValue(invRes.data.data ?? { costValue: 0, sellValue: 0 })
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [period, customStart, customEnd])

  const fetchExpenses = useCallback(async () => {
    if (period === 'custom' && (!customStart || !customEnd)) return
    setExpensesLoading(true)
    try {
      const params = new URLSearchParams({ ...activeDates, category: filterCategory })
      const res = await api.get(`/finance/expenses?${params}`)
      setExpenses(res.data.data ?? [])
    } catch {
      /* silent */
    } finally {
      setExpensesLoading(false)
    }
  }, [period, customStart, customEnd, filterCategory])

  const fetchChart = useCallback(async () => {
    try {
      const res = await api.get('/finance/chart?months=12')
      setChart(res.data.data ?? [])
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => { fetchSummary() }, [fetchSummary])
  useEffect(() => { fetchExpenses() }, [fetchExpenses])
  useEffect(() => { fetchChart() }, [fetchChart])

  // ── Expense dialog ──
  function openAdd() {
    setEditingExpense(null)
    const today = new Date().toISOString().slice(0, 10)
    setForm({ ...emptyForm, date: today })
    setOpenDialog(true)
  }

  function openEdit(exp: Expense) {
    setEditingExpense(exp)
    setForm({
      date: exp.date.slice(0, 10),
      category: exp.category,
      amount: String(exp.amount),
      description: exp.description,
    })
    setOpenDialog(true)
  }

  async function handleSave() {
    if (!form.category || !form.amount || !form.description || !form.date) return
    setSaving(true)
    try {
      if (editingExpense) {
        await api.put(`/finance/expenses/${editingExpense._id}`, form)
      } else {
        await api.post('/finance/expenses', form)
      }
      setOpenDialog(false)
      fetchExpenses()
      fetchSummary()
    } catch {
      /* silent */
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xarajatni o\'chirishni tasdiqlaysizmi?')) return
    try {
      await api.delete(`/finance/expenses/${id}`)
      fetchExpenses()
      fetchSummary()
    } catch {
      /* silent */
    }
  }

  const totalExpensesShown = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Moliya</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Daromad, xarajat va foyda tahlili</p>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={period === p.value ? 'default' : 'outline'}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-36 h-8" />
            <span className="text-muted-foreground text-sm">—</span>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-36 h-8" />
          </div>
        )}
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Daromad"
          value={summary.revenue}
          sub={`${summary.serviceCount} ta xizmat bajarildi`}
          icon={<Banknote className="w-5 h-5" />}
          theme="green"
          loading={loading}
        />
        <MetricCard
          title="Komissiya xarajati"
          value={summary.commissionsPaid}
          sub="Xodimlarga to'langan"
          icon={<Wallet className="w-5 h-5" />}
          theme="orange"
          loading={loading}
        />
        <MetricCard
          title="Boshqa xarajatlar"
          value={summary.otherExpenses}
          sub="Qo'lda kiritilgan"
          icon={<ReceiptText className="w-5 h-5" />}
          theme="red"
          loading={loading}
        />
        <MetricCard
          title="Sof foyda"
          value={summary.netProfit}
          sub="Daromad − barcha xarajatlar"
          icon={summary.netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          theme={summary.netProfit >= 0 ? 'emerald' : 'rose'}
          loading={loading}
          large
        />
        <MetricCard
          title="Qarzdorlik"
          value={summary.unpaidAmount}
          sub="To'lanmagan xizmatlar"
          icon={<AlertCircle className="w-5 h-5" />}
          theme="yellow"
          loading={loading}
        />
        <MetricCard
          title="Xizmatlar soni"
          value={summary.serviceCount}
          sub="Davr ichida"
          icon={<CalendarDays className="w-5 h-5" />}
          theme="blue"
          loading={loading}
          isCurrency={false}
        />
      </div>

      {/* Inventory value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InventoryCard
          title="Ombor — Xarid qiymati"
          value={inventoryValue.costValue}
          sub="Mahsulotlarga sarflangan mablag'"
          icon={<ShoppingCart className="w-5 h-5" />}
          theme="violet"
        />
        <InventoryCard
          title="Ombor — Sotish qiymati"
          value={inventoryValue.sellValue}
          sub="Hammasi sotilsa olinadigan summa"
          icon={<Package className="w-5 h-5" />}
          theme="cyan"
          profit={inventoryValue.sellValue - inventoryValue.costValue}
        />
      </div>

      {/* Monthly chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Oylik tahlil (so'nggi 12 oy)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="Daromad" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="commissions" name="Komissiya" fill="#f97316" radius={[2, 2, 0, 0]} />
              <Bar dataKey="otherExpenses" name="Boshqa xarajat" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expenses section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Boshqa xarajatlar</h2>
            {totalExpensesShown > 0 && (
              <Badge variant="outline">{fmt(totalExpensesShown)} so'm</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44 h-8">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openAdd} className="gap-1">
              <Plus className="w-4 h-4" />Xarajat qo'shish
            </Button>
          </div>
        </div>

        {expensesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg">
            Bu davrda xarajatlar yo'q
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Sana', 'Kategoriya', 'Tavsif', 'Miqdor', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(exp.date).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{CATEGORY_LABEL[exp.category] ?? exp.category}</Badge>
                    </td>
                    <td className="px-4 py-3">{exp.description}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{fmt(exp.amount)} so'm</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(exp)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(exp._id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense dialog */}
      <Dialog open={openDialog} onOpenChange={(v) => { setOpenDialog(v); if (!v) setForm(emptyForm) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}</DialogTitle>
            <DialogDescription>Xarajat ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Sana</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Kategoriya</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as CategoryValue }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Miqdor (so'm)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Input
                placeholder="Masalan: Yanvar ijarasi"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Bekor qilish</Button>
              <Button onClick={handleSave} disabled={saving || !form.amount || !form.description || !form.date}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editingExpense ? 'Saqlash' : 'Qo\'shish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────────────
function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(target)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null

    const step = (now: number) => {
      if (!startRef.current) startRef.current = now
      const t = Math.min((now - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else { fromRef.current = target; setDisplay(target) }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return display
}

// ─────────────────────────────────────────────────────
// Theme map
// ─────────────────────────────────────────────────────
const THEMES = {
  green:   { bg: 'from-green-500/10 to-green-500/5',   icon: 'bg-green-500/15 text-green-600',   value: 'text-green-700 dark:text-green-400',   border: 'border-green-200 dark:border-green-800' },
  orange:  { bg: 'from-orange-500/10 to-orange-500/5', icon: 'bg-orange-500/15 text-orange-600', value: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  red:     { bg: 'from-red-500/10 to-red-500/5',       icon: 'bg-red-500/15 text-red-600',       value: 'text-red-700 dark:text-red-400',       border: 'border-red-200 dark:border-red-800' },
  yellow:  { bg: 'from-yellow-500/10 to-yellow-500/5', icon: 'bg-yellow-500/15 text-yellow-600', value: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  blue:    { bg: 'from-blue-500/10 to-blue-500/5',     icon: 'bg-blue-500/15 text-blue-600',     value: 'text-blue-700 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-800' },
  emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', icon: 'bg-emerald-500/15 text-emerald-600', value: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-700' },
  rose:    { bg: 'from-rose-500/10 to-rose-500/5',     icon: 'bg-rose-500/15 text-rose-600',     value: 'text-rose-700 dark:text-rose-400',     border: 'border-rose-200 dark:border-rose-800' },
  violet:  { bg: 'from-violet-500/10 to-violet-500/5', icon: 'bg-violet-500/15 text-violet-600', value: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  cyan:    { bg: 'from-cyan-500/10 to-cyan-500/5',     icon: 'bg-cyan-500/15 text-cyan-600',     value: 'text-cyan-700 dark:text-cyan-400',     border: 'border-cyan-200 dark:border-cyan-800' },
} as const
type ThemeKey = keyof typeof THEMES

// ─────────────────────────────────────────────────────
// MetricCard
// ─────────────────────────────────────────────────────
function MetricCard({
  title, value, sub, icon, theme, loading = false, large = false, isCurrency = true,
}: {
  title: string
  value: number
  sub?: string
  icon: React.ReactNode
  theme: ThemeKey
  loading?: boolean
  large?: boolean
  isCurrency?: boolean
}) {
  const t = THEMES[theme]
  const animated = useAnimatedValue(value)

  return (
    <div
      className={`
        group relative rounded-2xl border ${t.border} bg-gradient-to-br ${t.bg}
        p-5 transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5 cursor-default
        ${large ? 'sm:col-span-1 ring-2 ring-offset-1 ring-offset-background ' + t.border : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
          {loading ? (
            <div className="h-8 w-32 rounded-lg bg-muted/60 animate-pulse mb-1" />
          ) : (
            <p className={`font-bold leading-none ${large ? 'text-3xl' : 'text-2xl'} ${t.value}`}>
              {isCurrency ? fmt(animated) : animated}
              {isCurrency && <span className="text-sm font-normal text-muted-foreground ml-1.5">so'm</span>}
            </p>
          )}
          {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${t.icon} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// InventoryCard
// ─────────────────────────────────────────────────────
function InventoryCard({
  title, value, sub, icon, theme, profit,
}: {
  title: string
  value: number
  sub: string
  icon: React.ReactNode
  theme: ThemeKey
  profit?: number
}) {
  const t = THEMES[theme]
  const animated = useAnimatedValue(value)
  const margin = profit !== undefined ? Math.round((profit / (value || 1)) * 100) : null

  return (
    <div className={`group relative rounded-2xl border ${t.border} bg-gradient-to-br ${t.bg} p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
          <p className={`text-2xl font-bold leading-none ${t.value}`}>
            {fmt(animated)}
            <span className="text-sm font-normal text-muted-foreground ml-1.5">so'm</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">{sub}</p>
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${t.icon} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      {profit !== undefined && profit > 0 && (
        <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Potensial foyda</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-emerald-600">+{fmt(profit)} so'm</span>
            {margin !== null && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-emerald-700 border-emerald-300">
                <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />{margin}%
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
