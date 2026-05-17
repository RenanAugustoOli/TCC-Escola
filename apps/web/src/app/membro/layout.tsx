'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MemberSidebar } from '@/components/MemberSidebar'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (user.role === 'ADMIN') { router.push('/dashboard'); return }
    if (user.role === 'PERSONAL_TRAINER') { router.push('/trainer'); return }
  }, [user, loading, router])

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

  if (!user || user.role !== 'MEMBER') return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MemberSidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  )
}
