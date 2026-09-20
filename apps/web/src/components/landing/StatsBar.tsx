'use client'

import { useCountUp } from './useCountUp'

const STATS = [
  { target: 1200, suffix: '+', label: 'Alunos ativos' },
  { target: 8, suffix: '', label: 'Anos de experiência' },
  { target: 45, suffix: '+', label: 'Aulas por semana' },
  { target: 60, suffix: '+', label: 'Equipamentos' },
]

function Stat({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { ref, value } = useCountUp(target)
  return (
    <div ref={ref} className="text-center">
      <p className="font-display font-black text-4xl sm:text-5xl text-gymtech-blue tabular-nums">
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-sm font-semibold text-gymtech-slate">{label}</p>
    </div>
  )
}

export function StatsBar() {
  return (
    <section className="bg-white py-14 border-b border-gymtech-mist">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>
    </section>
  )
}
