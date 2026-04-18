'use client'

import { useMemo } from 'react'
import { useAppSelector } from '@/lib/store/hooks'

const UI_MODULES: { prefix: string; coarse: string }[] = [
  { prefix: 'ui.dashboard.', coarse: 'dashboard.view' },
  { prefix: 'ui.service.', coarse: 'service.view' },
  { prefix: 'ui.vehicle.', coarse: 'service.view' },
  { prefix: 'ui.employees.', coarse: 'employees.view' },
  { prefix: 'ui.inventory.', coarse: 'inventory.view' },
  { prefix: 'ui.archives.', coarse: 'archives.view' },
  { prefix: 'ui.settings.', coarse: 'settings.view' }
]

/**
 * Modul bo‘yicha `ui.*` kalitlari berilganda faqat ular ko‘rinadi.
 * Hech qanday `ui.modul.*` yo‘q bo‘lsa — coarse `*.view` / `*.edit` bo‘lsa butun sahifa (oldingi xatti-harakat).
 */
export function canShowSection(permissions: string[] | null | undefined, uiKey: string): boolean {
  if (permissions == null) return true

  const mod = UI_MODULES.find((m) => uiKey.startsWith(m.prefix))
  if (!mod) return true

  const granular = permissions.filter((p) => p.startsWith(mod.prefix))
  const coarseOk =
    permissions.includes(mod.coarse) ||
    permissions.includes(mod.coarse.replace(/\.view$/, '.edit'))

  if (granular.length === 0) return coarseOk
  return permissions.includes(uiKey)
}

export function useCanShowSection(): (uiKey: string) => boolean {
  const permissions = useAppSelector((s) => s.auth.user?.permissions)
  return useMemo(() => (uiKey: string) => canShowSection(permissions, uiKey), [permissions])
}
