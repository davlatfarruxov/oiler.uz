'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAppSelector } from '@/lib/store/hooks'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type SessionRow = {
  id: string
  userAgent?: string
  ip?: string
  createdAt?: string
  lastUsedAt?: string
  isCurrent?: boolean
}

export default function SessionsPage() {
  const { user } = useAppSelector((s) => s.auth)
  const [mine, setMine] = useState<SessionRow[]>([])
  const [tenant, setTenant] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  const canTenant = user?.permissions?.includes('sessions.tenant')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/sessions')
      const data = (res.data as { data?: SessionRow[] }).data
      setMine(Array.isArray(data) ? data : [])
      if (user?.permissions?.includes('sessions.tenant')) {
        const tr = await api.get('/auth/tenant-sessions')
        const td = (tr.data as { data?: unknown[] }).data
        setTenant(Array.isArray(td) ? td : [])
      } else {
        setTenant([])
      }
    } catch {
      toast.error('Seanslarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [user?.permissions])

  useEffect(() => {
    load()
  }, [load])

  const revoke = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`)
      toast.success('Seans bekor qilindi')
      load()
    } catch {
      toast.error('Xatolik')
    }
  }

  const revokeOthers = async () => {
    try {
      await api.post('/auth/sessions/revoke-others')
      toast.success('Boshqa qurilmalardan chiqarildi')
      load()
    } catch {
      toast.error('Xatolik')
    }
  }

  const revokeTenant = async (id: string) => {
    try {
      await api.delete(`/auth/tenant-sessions/${id}`)
      toast.success('Seans bekor qilindi')
      load()
    } catch {
      toast.error('Xatolik')
    }
  }

  if (loading) return <p className="text-muted-foreground">Yuklanmoqda...</p>

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Seanslar</h1>
        <p className="text-sm text-muted-foreground">
          Har bir kirish alohida seans. Joriy seansni bekor qilmasdan boshqa seanslarni o‘chirishingiz mumkin.
        </p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={revokeOthers}>
          Boshqa seanslarni bekor qilish
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="px-4 py-2 border-b font-medium">Mening seanslarim</div>
        <ul className="divide-y">
          {mine.map((s) => (
            <li key={s.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <div>
                <div className="font-medium">
                  {s.isCurrent ? 'Joriy seans' : 'Seans'}{' '}
                  <span className="text-muted-foreground font-normal">{s.ip || '—'}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-md">{s.userAgent || '—'}</div>
                <div className="text-xs text-muted-foreground">
                  {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString('uz-UZ') : ''}
                </div>
              </div>
              {!s.isCurrent && (
                <Button size="sm" variant="destructive" onClick={() => revoke(s.id)}>
                  Bekor qilish
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {canTenant && tenant.length > 0 && (
        <div className="rounded-lg border">
          <div className="px-4 py-2 border-b font-medium">Tenant bo‘yicha barcha faol seanslar</div>
          <ul className="divide-y">
            {(tenant as { _id: string; user?: { name?: string; phone?: string }; ip?: string; userAgent?: string; lastUsedAt?: string }[]).map((row) => (
              <li key={row._id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium">
                    {row.user?.name || '—'} <span className="text-muted-foreground font-normal">{row.user?.phone}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{row.ip}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => revokeTenant(row._id)}>
                  Chiqarish
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
