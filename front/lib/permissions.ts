/** Backend `PermissionKey` bilan mos keladi */
export const PERMISSION_OPTIONS: { id: string; label: string }[] = [
  { id: 'dashboard.view', label: 'Bosh sahifa (ko‘rish)' },
  { id: 'service.view', label: 'Xizmat (ko‘rish)' },
  { id: 'service.edit', label: 'Xizmat (tahrirlash)' },
  { id: 'employees.view', label: 'Xodimlar (ko‘rish)' },
  { id: 'employees.edit', label: 'Xodimlar (tahrirlash)' },
  { id: 'inventory.view', label: 'Ombor (ko‘rish)' },
  { id: 'inventory.edit', label: 'Ombor (tahrirlash)' },
  { id: 'archives.view', label: 'Arxiv (ko‘rish)' },
  { id: 'settings.view', label: 'Sozlamalar (ko‘rish)' },
  { id: 'settings.edit', label: 'Sozlamalar (tahrirlash)' },
  { id: 'payments.view', label: 'To‘lovlar (ko‘rish)' },
  { id: 'payments.edit', label: 'To‘lovlar (tahrirlash)' },
  { id: 'appointments.view', label: 'Bronlar (ko‘rish)' },
  { id: 'appointments.edit', label: 'Bronlar (tahrirlash)' },
  { id: 'appointments.manage', label: 'Bronlar (barchasi / tayinlash)' },
  { id: 'employee_payments.view', label: 'Xodim to‘lovlari (ko‘rish)' },
  { id: 'employee_payments.edit', label: 'Xodim to‘lovlari (tahrirlash)' },
  { id: 'roles.manage', label: 'Rollar boshqaruvi' },
  { id: 'users.manage', label: 'Foydalanuvchilar (telefon + parol)' },
  { id: 'sessions.view', label: 'Seanslar (o‘zim)' },
  { id: 'sessions.tenant', label: 'Seanslar (butun tenant)' },

  { id: 'ui.dashboard.stats_kpis', label: 'UI: bosh sahifa — KPI kartalar' },
  { id: 'ui.dashboard.stats_payments', label: 'UI: bosh sahifa — to‘lov / qarz statistikasi' },
  { id: 'ui.dashboard.overdue_alert', label: 'UI: bosh sahifa — muddati o‘tgan ogohlantirish' },
  { id: 'ui.dashboard.active_services', label: 'UI: bosh sahifa — faol xizmatlar' },
  { id: 'ui.dashboard.charts', label: 'UI: bosh sahifa — diagrammalar' },
  { id: 'ui.dashboard.recent_services', label: 'UI: bosh sahifa — so‘nggi xizmatlar jadvali' },

  { id: 'ui.service.plate_search', label: 'UI: xizmat — davlat raqami qidiruv' },
  { id: 'ui.service.tab_recent', label: 'UI: xizmat — “Barcha xizmatlar” varag‘i' },
  { id: 'ui.service.tab_vehicles', label: 'UI: xizmat — “Barcha mashinalar” varag‘i' },
  { id: 'ui.service.detail_modal', label: 'UI: xizmat — xizmat detali oynasi' },

  { id: 'ui.vehicle.header_actions', label: 'UI: mashina — yangi xizmat tugmalari' },
  { id: 'ui.vehicle.summary_cards', label: 'UI: mashina — yuqori qisqa kartalar' },
  { id: 'ui.vehicle.payments', label: 'UI: mashina — qarz va to‘lov tarixi' },
  { id: 'ui.vehicle.info_card', label: 'UI: mashina — ma’lumotlar kartasi' },
  { id: 'ui.vehicle.oil_work', label: 'UI: mashina — moy / xizmat qo‘shish (dialoglar)' },
  { id: 'ui.vehicle.history', label: 'UI: mashina — birlashgan tarix' },

  { id: 'ui.employees.header_add', label: 'UI: xodimlar — “qo‘shish” tugmasi' },
  { id: 'ui.employees.stats', label: 'UI: xodimlar — statistik kartalar' },
  { id: 'ui.employees.table', label: 'UI: xodimlar — jadval' },

  { id: 'ui.inventory.low_stock_alert', label: 'UI: ombor — kam qolgan ogohlantirish' },
  { id: 'ui.inventory.tab_oil', label: 'UI: ombor — moy mahsulotlari varag‘i' },
  { id: 'ui.inventory.tab_filters', label: 'UI: ombor — filterlar varag‘i' },
  { id: 'ui.inventory.tab_products', label: 'UI: ombor — mahsulotlar varag‘i' },

  { id: 'ui.archives.main', label: 'UI: arxiv — asosiy kontent' },

  { id: 'ui.settings.tab_company', label: 'UI: sozlamalar — kompaniya' },
  { id: 'ui.settings.tab_subscription', label: 'UI: sozlamalar — obuna' },
  { id: 'ui.settings.tab_notifications', label: 'UI: sozlamalar — bildirishnomalar' },
  { id: 'ui.settings.tab_security', label: 'UI: sozlamalar — xavfsizlik' }
]
