'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { PERMISSION_OPTIONS } from '@/lib/permissions'
import { toast } from 'sonner'
import { Trash2, Plus, Pencil } from 'lucide-react'

type RoleRow = {
  _id: string
  name: string
  description?: string
  permissions: string[]
  isSystem?: boolean
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSystem, setEditingSystem] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/roles')
      const data = (res.data as { data?: RoleRow[] }).data
      setRoles(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Rollarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setEditingSystem(false)
    setName('')
    setDescription('')
    setSelected({})
    setOpen(true)
  }

  const openEdit = (r: RoleRow) => {
    setEditingId(r._id)
    setEditingSystem(!!r.isSystem)
    setName(r.name)
    setDescription(r.description ?? '')
    const next: Record<string, boolean> = {}
    for (const p of r.permissions || []) {
      next[p] = true
    }
    setSelected(next)
    setOpen(true)
  }

  const save = async () => {
    const permissions = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k)

    if (!name.trim()) {
      toast.error('Rol nomi kerak')
      return
    }

    if (!editingSystem && permissions.length === 0) {
      toast.error('Kamida bitta ruxsat tanlang')
      return
    }

    try {
      if (editingId) {
        const body: { name: string; description?: string; permissions?: string[] } = {
          name: name.trim(),
          description: description.trim() || undefined
        }
        if (!editingSystem) {
          body.permissions = permissions
        }
        await api.put(`/roles/${editingId}`, body)
        toast.success('Rol yangilandi')
      } else {
        await api.post('/roles', {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions
        })
        toast.success('Rol yaratildi')
      }
      setOpen(false)
      setEditingId(null)
      setEditingSystem(false)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Xatolik')
    }
  }

  const remove = async (id: string, isSystem?: boolean) => {
    if (isSystem) {
      toast.error('Tizim rolini o‘chirib bo‘lmaydi')
      return
    }
    if (!confirm('Rolni o‘chirishni tasdiqlaysizmi?')) return
    try {
      await api.delete(`/roles/${id}`)
      toast.success("Rol o'chirildi")
      load()
    } catch {
      toast.error('O‘chirishda xatolik')
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Yuklanmoqda...</p>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rollar</h1>
          <p className="text-sm text-muted-foreground">
            Tenant ichida rollar va ularning ruxsatlari. Foydalanuvchilarni «Foydalanuvchilar» bo‘limida roliga
            bog‘lang.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Yangi rol
        </Button>
      </div>

      <div className="rounded-lg border divide-y">
        {roles.map((r) => (
          <div key={r._id} className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <div className="font-semibold flex items-center gap-2">
                {r.name}
                {r.isSystem && (
                  <span className="text-xs font-normal text-muted-foreground">(tizim)</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {r.permissions?.length ?? 0} ta ruxsat
              </div>
            </div>
            <div className="flex items-center gap-1 self-end sm:self-start">
              <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Tahrirlash">
                <Pencil className="w-4 h-4" />
              </Button>
              {!r.isSystem && (
                <Button variant="ghost" size="icon" onClick={() => remove(r._id, r.isSystem)} aria-label="O‘chirish">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) {
            setEditingId(null)
            setEditingSystem(false)
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Rolni tahrirlash' : 'Yangi rol'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="rname">Rol nomi</Label>
              <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="rdesc">Izoh (ixtiyoriy)</Label>
              <Input
                id="rdesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                placeholder="Masalan: kassa uchun cheklangan rol"
              />
            </div>
            <div className="space-y-2">
              <Label>Ruxsatlar</Label>
              {editingSystem && (
                <p className="text-xs text-muted-foreground">
                  Tizim roli: ruxsatlar ro‘yxati o‘zgartirilmaydi; faqat nom va izohni yangilashingiz mumkin.
                </p>
              )}
              <div className="grid gap-2 border rounded-md p-3 max-h-64 overflow-y-auto">
                {PERMISSION_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      disabled={editingSystem}
                      checked={!!selected[opt.id]}
                      onCheckedChange={(v) =>
                        setSelected((s) => ({ ...s, [opt.id]: v === true }))
                      }
                    />
                    <span className={editingSystem ? 'text-muted-foreground' : undefined}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Bekor
            </Button>
            <Button onClick={save}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
