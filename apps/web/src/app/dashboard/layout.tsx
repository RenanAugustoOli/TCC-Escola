'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/Sidebar'
import { canAccessDashboardPath } from '@/lib/permissions'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (user.role === 'MEMBER') { router.push('/membro'); return }
    if (user.role === 'PERSONAL_TRAINER') { router.push('/trainer'); return }
    if (!canAccessDashboardPath(user.role, pathname)) { router.push('/dashboard/alunos'); return }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#0047AB' }}>
            <span className="font-black text-white text-lg">G</span>
          </div>
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'RECEPTIONIST')) return null
  if (!canAccessDashboardPath(user.role, pathname)) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen">{children}</main>
    </div>
  )
}
