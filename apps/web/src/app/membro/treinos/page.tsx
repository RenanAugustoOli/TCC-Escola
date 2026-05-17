'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Workout, PersonalWorkout } from '@academia/shared'
import { Clock, Dumbbell, CheckCircle, Star } from 'lucide-react'

const DIFFICULTY_LABELS = { BEGINNER: 'Iniciante', INTERMEDIATE: 'Intermediário', ADVANCED: 'Avançado' }
const DIFFICULTY_STYLE = {
  BEGINNER:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  INTERMEDIATE: 'bg-amber-50 text-amber-700 border border-amber-200',
  ADVANCED:     'bg-red-50 text-red-700 border border-red-200',
}

function WorkoutCard({ workout, onComplete }: { workout: Workout; onComplete: () => void }) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between mb-3 gap-3">
        <h3 className="font-bold text-gray-900">{workout.name}</h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${DIFFICULTY_STYLE[workout.difficulty]}`}>
          {DIFFICULTY_LABELS[workout.difficulty]}
        </span>
      </div>
      {workout.description && <p className="text-sm text-gray-400 mb-3">{workout.description}</p>}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1.5"><Clock size={13} />{workout.durationMinutes} min</span>
        <span className="flex items-center gap-1.5"><Dumbbell size={13} />{workout.exercises.length} exercícios</span>
      </div>
      <div className="space-y-1.5 mb-5 flex-1">
        {workout.exercises.map((ex, i) => (
          <div key={ex.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
            <span className="text-gray-600">{i + 1}. {ex.name}</span>
            <span className="font-bold text-xs" style={{ color: '#0047AB' }}>{ex.sets}×{ex.reps}</span>
          </div>
        ))}
      </div>
      <button onClick={onComplete} className="btn-primary w-full text-sm">
        <CheckCircle size={15} /> Concluir Treino
      </button>
    </div>
  )
}

function PersonalWorkoutCard({ pw, onComplete }: { pw: PersonalWorkout; onComplete: () => void }) {
  return (
    <div className="card flex flex-col relative" style={{ borderColor: '#0047AB', borderWidth: 2 }}>
      <div className="absolute -top-3 left-4">
        <span className="text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm" style={{ backgroundColor: '#0047AB' }}>
          <Star size={10} fill="white" /> Personal
        </span>
      </div>
      <div className="mt-3 mb-3">
        <h3 className="font-bold text-gray-900">{pw.name}</h3>
        {pw.description && <p className="text-sm text-gray-400 mt-0.5">{pw.description}</p>}
        <p className="text-xs mt-1 font-medium" style={{ color: '#0047AB' }}>por {pw.trainer?.name}</p>
      </div>
      <div className="space-y-1.5 mb-5 flex-1">
        {pw.exercises.map((ex, i) => (
          <div key={ex.id} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: '#e8f0fb' }}>
            <span className="text-gray-600">{i + 1}. {ex.name}</span>
            <span className="font-bold text-xs" style={{ color: '#0047AB' }}>{ex.sets}×{ex.reps}</span>
          </div>
        ))}
      </div>
      <button onClick={onComplete} className="btn-primary w-full text-sm">
        <CheckCircle size={15} /> Concluir Treino
      </button>
    </div>
  )
}

export default function TreinosMembroPage() {
  const queryClient = useQueryClient()

  const { data: planWorkouts = [] } = useQuery<Workout[]>({
    queryKey: ['my-workouts'],
    queryFn: () => api.get('/workouts').then((r) => r.data),
  })

  const { data: personalWorkouts = [] } = useQuery<PersonalWorkout[]>({
    queryKey: ['personal-workouts-my'],
    queryFn: () => api.get('/personal-workouts/my').then((r) => r.data),
  })

  const completeWorkout = useMutation({
    mutationFn: (id: string) => api.post(`/workouts/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-history'] }),
  })

  const completePersonal = useMutation({
    mutationFn: (id: string) => api.post(`/personal-workouts/${id}/complete`),
  })

  const hasPersonal = personalWorkouts.length > 0
  const hasPlan = planWorkouts.length > 0

  if (!hasPersonal && !hasPlan) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Meus Treinos</h1></div>
        <div className="card flex flex-col items-center py-16 text-center">
          <Dumbbell size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">Nenhum treino disponível ainda.</p>
          <p className="text-gray-400 text-sm mt-1">Fale com um personal trainer ou verifique seu plano.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Meus Treinos</h1>
        <p className="page-subtitle">
          {hasPersonal ? `${personalWorkouts.length} personalizado(s) · ` : ''}
          {hasPlan ? `${planWorkouts.length} do plano` : ''}
        </p>
      </div>

      {hasPersonal && (
        <div className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Treinos Personalizados</h2>
          <div className="grid grid-cols-2 gap-5">
            {personalWorkouts.map((pw) => (
              <PersonalWorkoutCard key={pw.id} pw={pw} onComplete={() => completePersonal.mutate(pw.id)} />
            ))}
          </div>
        </div>
      )}

      {hasPlan && (
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Treinos do Plano</h2>
          <div className="grid grid-cols-2 gap-5">
            {planWorkouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} onComplete={() => completeWorkout.mutate(w.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
