import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kiosk — qabul',
  description: 'Mashina raqami va oxirgi xizmat (ikkinchi ekran)'
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-black text-zinc-50 antialiased">{children}</div>
  )
}
