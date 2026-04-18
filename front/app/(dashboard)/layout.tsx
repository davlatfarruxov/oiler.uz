'use client'

import React from "react"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { logoutUser, getProfile } from '@/lib/store/slices/authSlice'
import { TenantProvider, useTenant } from '@/lib/contexts/TenantContext'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Wrench,
  Users,
  Package,
  Settings,
  Menu,
  X,
  LogOut,
  Loader2,
  Building2,
  Archive,
  Shield,
  KeyRound,
  UserCog,
} from 'lucide-react'
import { Toaster } from 'sonner'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  perm: string
}

const ALL_NAV: NavItem[] = [
  { name: 'Bosh sahifa', href: '/dashboard', icon: BarChart3, perm: 'dashboard.view' },
  { name: 'Xizmat', href: '/dashboard/service', icon: Wrench, perm: 'service.view' },
  { name: 'Xodimlar', href: '/dashboard/employees', icon: Users, perm: 'employees.view' },
  { name: 'Ombor', href: '/dashboard/inventory', icon: Package, perm: 'inventory.view' },
  { name: 'Arxiv', href: '/dashboard/archives', icon: Archive, perm: 'archives.view' },
  { name: 'Sozlamalar', href: '/dashboard/settings', icon: Settings, perm: 'settings.view' },
  { name: 'Rollar', href: '/dashboard/roles', icon: Shield, perm: 'roles.manage' },
  { name: 'Foydalanuvchilar', href: '/dashboard/tenant-users', icon: UserCog, perm: 'users.manage' },
  { name: 'Seanslar', href: '/dashboard/sessions', icon: KeyRound, perm: 'sessions.view' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TenantProvider>
      <DashboardContent>{children}</DashboardContent>
    </TenantProvider>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, accessToken, isLoading } = useAppSelector((state) => state.auth)
  const { tenant } = useTenant()

  const sidebarItems = useMemo(() => {
    const perms = user?.permissions
    if (!perms || perms.length === 0) return ALL_NAV
    return ALL_NAV.filter((item) => perms.includes(item.perm))
  }, [user?.permissions])

  useEffect(() => {
    if (!accessToken) {
      router.push('/login')
    } else if (!user) {
      dispatch(getProfile())
    }
  }, [accessToken, user, router, dispatch])

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/login')
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20',
          'md:relative md:z-auto'
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sidebar-foreground" />
              <div className="flex flex-col">
                <h1 className="font-bold text-sm text-sidebar-foreground">
                  {tenant?.companyName || 'OilServe'}
                </h1>
                <span className="text-xs text-sidebar-foreground/60 capitalize">
                  {tenant?.plan || 'Free'} Plan
                </span>
              </div>
            </div>
          ) : (
            <Building2 className="w-5 h-5 text-sidebar-foreground" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-sidebar-accent rounded-md transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-sidebar-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-sidebar-foreground" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors',
              'text-sidebar-foreground hover:bg-sidebar-accent'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-20 md:ml-0">
        {/* Top Nav */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-muted rounded-md transition-colors md:hidden"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">
                {tenant?.companyName || 'Boshqaruv paneli'}
              </h2>
              {(tenant?.businessEmail || tenant?.businessPhone) && (
                <span className="text-xs text-muted-foreground">
                  {tenant.businessEmail || tenant.businessPhone}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.phone || user.email || user.role}
              </span>
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-6">{children}</div>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
