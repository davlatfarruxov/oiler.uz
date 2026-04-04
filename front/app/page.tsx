'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Redirecting to Dashboard...</h1>
        <p className="text-muted-foreground">If you are not redirected, please click the dashboard link</p>
      </div>
    </div>
  )
}
//salom
