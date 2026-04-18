'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

type RoleOpt = { _id: string; name: string }
type UserRow = {
  _id: string
  name: string
  phone?: string
  role: string
  isActive: boolean
  assignedRole?: { name: string }
}

export default function TenantUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<RoleOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ur, rr] = await Promise.all([api.get('/tenant-users'), api.get('/roles')])
      setUsers(((ur.data as { data?: UserRow[] }).data || []) as UserRow[])
      setRoles(((rr.data as { data?: RoleOpt[] }).data || []) as RoleOpt[])
    } catch {
      toast.error('Ma’lumot yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    if (!name.trim() || !phone.trim() || !password || !roleId) {
      toast.error('Barcha maydonlarni to‘ldiring')
      return
    }
    try {
      await api.post('/tenant-users', { name: name.trim(), phone, password, roleId })
      toast.success('Foydalanuvchi yaratildi')
      setOpen(false)
      setName('')
      setPhone('')
      setPassword('')
      setRoleId('')
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Xatolik')
    }
  }

  if (loading) return <p className="text-muted-foreground">Yuklanmoqda...</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
          <p className="text-sm text-muted-foreground">Telefon + parol bilan kiradigan akkauntlar va rollar.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Qo‘shish
        </Button>
      </div>

      <div className="rounded-lg border divide-y">
        {users.map((u) => (
          <div key={u._id} className="p-4 flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
            <div>
              <div className="font-medium">{u.name}</div>
              <div className="text-muted-foreground">{u.phone}</div>
              <div className="text-xs text-muted-foreground">
                Rol: {u.assignedRole?.name || '—'} · {u.role} · {u.isActive ? 'faol' : 'nofaol'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi foydalanuvchi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Ism</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Parol</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Rol</Label>
              <select
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">— tanlang —</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Bekor
            </Button>
            <Button onClick={create}>Yaratish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
