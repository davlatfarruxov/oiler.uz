import type { PermissionKey } from '../constants/permissions';

type Rule = { test: RegExp; method: RegExp; permission: PermissionKey | 'SKIP' };

/**
 * URL /api/v1/... + HTTP method → talab qilinadigan ruxsat.
 * SKIP = faqat autentifikatsiya yetarli.
 */
const RULES: Rule[] = [
  { test: /^\/api\/v1\/auth\/register$/, method: /^POST$/, permission: 'SKIP' },
  { test: /^\/api\/v1\/auth\/login$/, method: /^POST$/, permission: 'SKIP' },
  { test: /^\/api\/v1\/auth\/refresh$/, method: /^POST$/, permission: 'SKIP' },
  { test: /^\/api\/v1\/auth\/logout$/, method: /^POST$/, permission: 'SKIP' },
  { test: /^\/api\/v1\/auth\/profile$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/auth\/sessions$/, method: /^GET$/, permission: 'sessions.view' },
  { test: /^\/api\/v1\/auth\/sessions\/revoke-others$/, method: /^POST$/, permission: 'sessions.view' },
  { test: /^\/api\/v1\/auth\/sessions\/[^/]+$/, method: /^DELETE$/, permission: 'sessions.view' },
  { test: /^\/api\/v1\/auth\/tenant-sessions$/, method: /^GET$/, permission: 'sessions.tenant' },
  { test: /^\/api\/v1\/auth\/tenant-sessions\/[^/]+$/, method: /^DELETE$/, permission: 'sessions.tenant' },
  { test: /^\/api\/v1\/oil-changes\/[^/]+\/public$/, method: /^GET$/, permission: 'SKIP' },
  { test: /^\/api\/v1\/settings\/public$/, method: /^GET$/, permission: 'SKIP' },
  { test: /^\/api\/v1\/public\//, method: /^GET$/, permission: 'SKIP' },
  { test: /^\/api\/v1\/admin\//, method: /.*/, permission: 'SKIP' },

  { test: /^\/api\/v1\/vehicles\/search\//, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/vehicles\/archived$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/vehicles\/count$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/vehicles\/active-services$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/vehicles\/[^/]+\/history$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/vehicles\/[^/]+\/unified-history$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/vehicles\/[^/]+\/archive-history$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/vehicles\/[^/]+$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/vehicles$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/vehicles$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/vehicles\/[^/]+$/, method: /^PUT$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/vehicles\/[^/]+\/archive$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/vehicles\/[^/]+\/restore$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/vehicles\/[^/]+$/, method: /^DELETE$/, permission: 'service.edit' },

  { test: /^\/api\/v1\/oil-changes\/archived$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/oil-changes\/today-count$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/oil-changes\/monthly-revenue$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/oil-changes\/recent$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/oil-changes\/employee\/[^/]+\/commissions$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/oil-changes\/[^/]+\/archive-history$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/oil-changes\/[^/]+$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/oil-changes$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/oil-changes$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/oil-changes\/[^/]+$/, method: /^PUT$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/oil-changes\/[^/]+\/archive$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/oil-changes\/[^/]+\/restore$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/oil-changes\/[^/]+\/complete$/, method: /^POST$/, permission: 'service.edit' },

  { test: /^\/api\/v1\/employees\/archived$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/employees\/stats$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/employees\/debt\/total$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/employees\/[^/]+\/performance$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/employees\/[^/]+\/statistics$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/employees\/[^/]+\/services$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/employees\/[^/]+$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/employees$/, method: /^GET$/, permission: 'employees.view' },
  { test: /^\/api\/v1\/employees$/, method: /^POST$/, permission: 'employees.edit' },
  { test: /^\/api\/v1\/employees\/[^/]+$/, method: /^PUT$/, permission: 'employees.edit' },
  { test: /^\/api\/v1\/employees\/[^/]+$/, method: /^PATCH$/, permission: 'employees.edit' },
  { test: /^\/api\/v1\/employees\/[^/]+$/, method: /^DELETE$/, permission: 'employees.edit' },
  { test: /^\/api\/v1\/employees\/[^/]+\/archive$/, method: /^POST$/, permission: 'employees.edit' },

  // Bosh sahifadagi «kam qoldiq» ko‘rsatkichi — dashboardga kirganlar o‘qishi kerak (to‘liq ombor emas)
  { test: /^\/api\/v1\/inventory\/low-stock$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/inventory\/[^/]+$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/inventory$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/inventory$/, method: /^POST$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/inventory\/[^/]+$/, method: /^PUT$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/inventory\/[^/]+\/stock$/, method: /^PATCH$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/inventory\/[^/]+$/, method: /^DELETE$/, permission: 'inventory.edit' },

  { test: /^\/api\/v1\/oil-products\/low-stock\/list$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/oil-products\/[^/]+$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/oil-products$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/oil-products$/, method: /^POST$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/oil-products\/[^/]+$/, method: /^PUT$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/oil-products\/[^/]+\/stock$/, method: /^PATCH$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/oil-products\/[^/]+$/, method: /^DELETE$/, permission: 'inventory.edit' },

  { test: /^\/api\/v1\/oil-brands\/[^/]+$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/oil-brands$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/oil-brands$/, method: /^POST$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/oil-brands\/[^/]+$/, method: /^PUT$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/oil-brands\/[^/]+$/, method: /^DELETE$/, permission: 'inventory.edit' },

  { test: /^\/api\/v1\/filters\/low-stock$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/filters\/[^/]+$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/filters$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/filters$/, method: /^POST$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/filters\/[^/]+$/, method: /^PUT$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/filters\/[^/]+\/stock$/, method: /^PATCH$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/filters\/[^/]+$/, method: /^DELETE$/, permission: 'inventory.edit' },

  { test: /^\/api\/v1\/filter-brands\/[^/]+$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/filter-brands$/, method: /^GET$/, permission: 'inventory.view' },
  { test: /^\/api\/v1\/filter-brands$/, method: /^POST$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/filter-brands\/[^/]+$/, method: /^PUT$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/filter-brands\/[^/]+\/toggle-status$/, method: /^PATCH$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/filter-brands\/[^/]+$/, method: /^DELETE$/, permission: 'inventory.edit' },

  { test: /^\/api\/v1\/archives$/, method: /^GET$/, permission: 'archives.view' },
  { test: /^\/api\/v1\/archives\//, method: /^GET$/, permission: 'archives.view' },

  { test: /^\/api\/v1\/settings$/, method: /^GET$/, permission: 'settings.view' },
  { test: /^\/api\/v1\/settings\/company$/, method: /^PUT$/, permission: 'settings.edit' },
  { test: /^\/api\/v1\/settings\/service-defaults$/, method: /^PUT$/, permission: 'settings.edit' },
  { test: /^\/api\/v1\/settings\/notifications$/, method: /^GET$/, permission: 'settings.view' },
  { test: /^\/api\/v1\/settings\/notifications$/, method: /^PUT$/, permission: 'settings.edit' },
  { test: /^\/api\/v1\/settings\/change-password$/, method: /^POST$/, permission: 'settings.view' },
  { test: /^\/api\/v1\/settings\/exchange-rate$/, method: /^PUT$/, permission: 'settings.edit' },

  { test: /^\/api\/v1\/payments\/customer\/[^/]+\/summary$/, method: /^GET$/, permission: 'payments.view' },
  { test: /^\/api\/v1\/payments\/customer\/[^/]+\/history$/, method: /^GET$/, permission: 'payments.view' },
  { test: /^\/api\/v1\/payments\/overdue$/, method: /^GET$/, permission: 'payments.view' },
  { test: /^\/api\/v1\/payments$/, method: /^GET$/, permission: 'payments.view' },
  { test: /^\/api\/v1\/payments$/, method: /^POST$/, permission: 'payments.edit' },

  { test: /^\/api\/v1\/appointments\/all$/, method: /^GET$/, permission: 'appointments.manage' },
  { test: /^\/api\/v1\/appointments\/[^/]+\/assign$/, method: /^PATCH$/, permission: 'appointments.manage' },
  { test: /^\/api\/v1\/appointments$/, method: /^POST$/, permission: 'appointments.edit' },
  { test: /^\/api\/v1\/appointments$/, method: /^GET$/, permission: 'appointments.view' },
  { test: /^\/api\/v1\/appointments\/[^/]+$/, method: /^GET$/, permission: 'appointments.view' },
  { test: /^\/api\/v1\/appointments\/[^/]+\/status$/, method: /^PATCH$/, permission: 'appointments.edit' },
  { test: /^\/api\/v1\/appointments\/[^/]+\/cancel$/, method: /^PATCH$/, permission: 'appointments.edit' },

  { test: /^\/api\/v1\/employee-payments\/employee\/[^/]+\/summary$/, method: /^GET$/, permission: 'employee_payments.view' },
  { test: /^\/api\/v1\/employee-payments\/employee\/[^/]+$/, method: /^GET$/, permission: 'employee_payments.view' },
  { test: /^\/api\/v1\/employee-payments\/[^/]+$/, method: /^GET$/, permission: 'employee_payments.view' },
  { test: /^\/api\/v1\/employee-payments$/, method: /^POST$/, permission: 'employee_payments.edit' },

  { test: /^\/api\/v1\/services\/[^/]+\/archive-history$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/services\/[^/]+\/complete$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/services\/[^/]+\/archive$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/services\/[^/]+$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/services$/, method: /^GET$/, permission: 'service.view' },
  { test: /^\/api\/v1\/services$/, method: /^POST$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/services\/[^/]+$/, method: /^PUT$/, permission: 'service.edit' },
  { test: /^\/api\/v1\/services\/[^/]+$/, method: /^DELETE$/, permission: 'service.edit' },

  { test: /^\/api\/v1\/roles/, method: /.*/, permission: 'roles.manage' },
  { test: /^\/api\/v1\/tenant-users/, method: /.*/, permission: 'users.manage' },

  { test: /^\/api\/v1\/finance\/summary$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/finance\/chart$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/finance\/inventory-value$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/finance\/expenses$/, method: /^GET$/, permission: 'dashboard.view' },
  { test: /^\/api\/v1\/finance\/expenses$/, method: /^POST$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/finance\/expenses\/[^/]+$/, method: /^PUT$/, permission: 'inventory.edit' },
  { test: /^\/api\/v1\/finance\/expenses\/[^/]+$/, method: /^DELETE$/, permission: 'inventory.edit' }
];

function pathWithoutQuery(url: string): string {
  return url.split('?')[0];
}

export function getRequiredRoutePermission(method: string, originalUrl: string): PermissionKey | 'SKIP' | null {
  const path = pathWithoutQuery(originalUrl);
  for (const rule of RULES) {
    if (rule.method.test(method) && rule.test.test(path)) {
      return rule.permission;
    }
  }
  return null;
}
