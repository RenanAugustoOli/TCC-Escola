'use client'

import { useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Modalidades', href: '#modalidades' },
  { label: 'Planos', href: '#planos' },
  { label: 'Contato', href: '#contato' },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gymtech-mist">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-2.5 font-display font-extrabold text-lg text-gymtech-ink">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gymtech-blue text-white">
            <Zap className="w-5 h-5" strokeWidth={2.5} />
          </span>
          Gym<span className="text-gymtech-blue">Tech</span>
        </a>

        <nav className="hidden md:flex items-center gap-8" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-gymtech-slate hover:text-gymtech-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gymtech-blue/40 rounded"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#matricula"
          className="hidden md:inline-flex relative overflow-hidden items-center gap-2 px-5 py-2.5 rounded-full bg-gymtech-blue text-white text-sm font-bold shadow-md shadow-gymtech-blue/30 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gymtech-blue/50 focus-visible:ring-offset-2 group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <span className="relative">Matricule-se</span>
        </a>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-gymtech-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gymtech-blue/40"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gymtech-mist px-5 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm font-semibold text-gymtech-ink border-b border-gymtech-mist last:border-0"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#matricula"
            onClick={() => setOpen(false)}
            className="mt-3 text-center py-3 rounded-full bg-gymtech-blue text-white text-sm font-bold"
          >
            Matricule-se
          </a>
        </div>
      )}
    </header>
  )
}
