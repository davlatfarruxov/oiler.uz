/** Tenant ichidagi modul ruxsatlari (sidebar + maxsus amallar) */
export const PERMISSION_KEYS = [
  'dashboard.view',
  'service.view',
  'service.edit',
  'employees.view',
  'employees.edit',
  'inventory.view',
  'inventory.edit',
  'archives.view',
  'settings.view',
  'settings.edit',
  'payments.view',
  'payments.edit',
  'appointments.view',
  'appointments.edit',
  'appointments.manage',
  'employee_payments.view',
  'employee_payments.edit',
  'roles.manage',
  'users.manage',
  'sessions.view',
  'sessions.tenant',

  // UI: bosh sahifa bo‘limlari (granular; bo‘lmasa — faqat coarse dashboard.view)
  'ui.dashboard.stats_kpis',
  'ui.dashboard.stats_payments',
  'ui.dashboard.overdue_alert',
  'ui.dashboard.active_services',
  'ui.dashboard.charts',
  'ui.dashboard.recent_services',

  // UI: xizmatlar ro‘yxati
  'ui.service.plate_search',
  'ui.service.tab_recent',
  'ui.service.tab_vehicles',
  'ui.service.detail_modal',

  // UI: mashina / xizmat detali
  'ui.vehicle.header_actions',
  'ui.vehicle.summary_cards',
  'ui.vehicle.payments',
  'ui.vehicle.info_card',
  'ui.vehicle.oil_work',
  'ui.vehicle.history',

  // UI: xodimlar
  'ui.employees.header_add',
  'ui.employees.stats',
  'ui.employees.table',

  // UI: ombor
  'ui.inventory.low_stock_alert',
  'ui.inventory.tab_oil',
  'ui.inventory.tab_filters',
  'ui.inventory.tab_products',

  // UI: arxiv
  'ui.archives.main',

  // UI: sozlamalar varaqlari
  'ui.settings.tab_company',
  'ui.settings.tab_subscription',
  'ui.settings.tab_notifications',
  'ui.settings.tab_security'
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const ALL_PERMISSIONS: PermissionKey[] = [...PERMISSION_KEYS];

/** Yangi tenant uchun standart "xodim" roli */
export const DEFAULT_EMPLOYEE_PERMISSIONS: PermissionKey[] = [
  'dashboard.view',
  'service.view',
  'service.edit',
  'employees.view',
  'inventory.view',
  'inventory.edit',
  'archives.view',
  'appointments.view',
  'appointments.edit',
  'payments.view',
  'payments.edit',
  'employee_payments.view',
  'sessions.view'
];

export function isValidPermission(p: string): p is PermissionKey {
  return (PERMISSION_KEYS as readonly string[]).includes(p);
}
