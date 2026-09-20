'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { canAccessDashboardPath } from '@/lib/permissions'
import {
  LayoutDashboard, Users, CreditCard, Dumbbell,
  FileText, LogOut, Settings, ClipboardList, ChevronRight, Bell, CalendarDays,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/dashboard/alunos', icon: Users },
  { label: 'Planos', href: '/dashboard/planos', icon: ClipboardList },
  { label: 'Assinaturas', href: '/dashboard/assinaturas', icon: CreditCard },
  { label: 'Aulas', href: '/dashboard/aulas', icon: CalendarDays },
  { label: 'Treinos', href: '/dashboard/treinos', icon: Dumbbell },
  { label: 'Pagamentos', href: '/dashboard/pagamentos', icon: FileText },
  { label: 'Notificações', href: '/dashboard/notificacoes', icon: Bell },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const visibleNavItems = user ? navItems.filter((item) => canAccessDashboardPath(user.role, item.href)) : navItems

  return (
    <aside className="w-64 flex flex-col h-screen fixed left-0 top-0 bg-[#0d1b2e] border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: '#0047AB' }}
          >
            <span className="text-base font-black text-white">G</span>
          </div>
          <div>
            <p className="font-black text-white text-sm tracking-tight leading-none">GymTech</p>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Administração</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider px-3 mb-2">Menu</p>
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={active ? { backgroundColor: '#0047AB' } : {}}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={13} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Usuário */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: '#0047AB' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-none">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 text-slate-500 hover:text-red-400 text-sm w-full px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}
