'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Workout } from '@academia/shared'
import { Clock, Dumbbell } from 'lucide-react'

const DIFFICULTY_LABEL = { BEGINNER: 'Iniciante', INTERMEDIATE: 'Intermediário', ADVANCED: 'Avançado' }
const DIFFICULTY_STYLE = {
  BEGINNER:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  INTERMEDIATE: 'bg-amber-50 text-amber-700 border border-amber-200',
  ADVANCED:     'bg-red-50 text-red-700 border border-red-200',
}

export default function TreinosPage() {
  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => api.get('/workouts').then((r) => r.data),
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Treinos</h1>
        <p className="page-subtitle">Catálogo de treinos disponíveis nos planos</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {workouts.map((w) => (
            <div key={w.id} className="card flex flex-col">
              <div className="flex items-start justify-between mb-3 gap-3">
                <h3 className="font-bold text-gray-900">{w.name}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${DIFFICULTY_STYLE[w.difficulty]}`}>
                  {DIFFICULTY_LABEL[w.difficulty]}
                </span>
              </div>

              {w.description && <p className="text-sm text-gray-400 mb-3">{w.description}</p>}

              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {w.durationMinutes} min
                </div>
                <div className="flex items-center gap-1.5">
                  <Dumbbell size={13} />
                  {w.exercises.length} exercícios
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                {w.exercises.slice(0, 4).map((ex, i) => (
                  <div key={ex.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                    <span className="text-gray-600">{i + 1}. {ex.name}</span>
                    <span className="font-bold text-xs" style={{ color: '#0047AB' }}>{ex.sets}×{ex.reps}</span>
                  </div>
                ))}
                {w.exercises.length > 4 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{w.exercises.length - 4} exercícios</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
