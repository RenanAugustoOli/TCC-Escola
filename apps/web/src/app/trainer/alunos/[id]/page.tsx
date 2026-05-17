'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Edit2, X, Dumbbell } from 'lucide-react'
import Link from 'next/link'

interface ExerciseForm {
  name: string; sets: string; reps: string; restSeconds: string; notes: string
}

const emptyExercise = (): ExerciseForm => ({ name: '', sets: '3', reps: '12', restSeconds: '60', notes: '' })

export default function StudentWorkoutsPage() {
  const { id: studentId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDesc, setWorkoutDesc] = useState('')
  const [exercises, setExercises] = useState<ExerciseForm[]>([emptyExercise()])

  const { data: student } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.get(`/users/${studentId}`).then((r) => r.data),
  })

  const { data: personalWorkouts = [], isLoading } = useQuery({
    queryKey: ['personal-workouts-student', studentId],
    queryFn: () => api.get(`/personal-workouts/student/${studentId}`).then((r) => r.data),
  })

  const createWorkout = useMutation({
    mutationFn: (data: object) => api.post('/personal-workouts', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personal-workouts-student', studentId] }); resetForm() },
  })

  const updateWorkout = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => api.put(`/personal-workouts/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personal-workouts-student', studentId] }); resetForm() },
  })

  const deleteWorkout = useMutation({
    mutationFn: (id: string) => api.delete(`/personal-workouts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-workouts-student', studentId] }),
  })

  const resetForm = () => {
    setShowForm(false); setEditingId(null)
    setWorkoutName(''); setWorkoutDesc('')
    setExercises([emptyExercise()])
  }

  const startEdit = (pw: any) => {
    setEditingId(pw.id); setWorkoutName(pw.name); setWorkoutDesc(pw.description ?? '')
    setExercises(pw.exercises.map((ex: any) => ({
      name: ex.name, sets: String(ex.sets), reps: ex.reps,
      restSeconds: String(ex.restSeconds), notes: ex.notes ?? '',
    })))
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: workoutName, description: workoutDesc, studentId,
      exercises: exercises.filter((ex) => ex.name).map((ex, i) => ({
        name: ex.name, sets: Number(ex.sets), reps: ex.reps,
        restSeconds: Number(ex.restSeconds), notes: ex.notes || undefined, order: i,
      })),
    }
    if (editingId) updateWorkout.mutate({ id: editingId, data })
    else createWorkout.mutate(data)
  }

  const addExercise = () => setExercises([...exercises, emptyExercise()])
  const removeExercise = (i: number) => setExercises(exercises.filter((_, idx) => idx !== i))
  const updateExercise = (i: number, field: keyof ExerciseForm, value: string) =>
    setExercises(exercises.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/trainer/alunos"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors shadow-sm"
        >
          <ArrowLeft size={17} />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">Treinos de {student?.name ?? '...'}</h1>
          <p className="page-subtitle">{student?.email}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-primary text-sm"
        >
          <Plus size={15} />
          Novo Treino
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-8" style={{ borderWidth: 2, borderColor: '#0047AB' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">
              {editingId ? 'Editar Treino' : 'Criar Treino Personalizado'}
            </h2>
            <button onClick={resetForm} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nome do treino</label>
                <input
                  className="input"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  required
                  placeholder="Ex: Treino A — Membros inferiores"
                />
              </div>
              <div>
                <label className="label">
                  Descrição <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  className="input"
                  value={workoutDesc}
                  onChange={(e) => setWorkoutDesc(e.target.value)}
                  placeholder="Observações gerais..."
                />
              </div>
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">Exercícios ({exercises.length})</label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="text-xs font-semibold flex items-center gap-1 transition-colors"
                  style={{ color: '#0047AB' }}
                >
                  <Plus size={13} /> Adicionar
                </button>
              </div>

              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                <span className="col-span-4">Exercício</span>
                <span className="col-span-2">Séries</span>
                <span className="col-span-2">Reps</span>
                <span className="col-span-2">Descanso(s)</span>
                <span className="col-span-1">Obs.</span>
              </div>

              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2.5">
                    <div className="col-span-4">
                      <input
                        className="input text-xs py-2"
                        placeholder="Nome do exercício"
                        value={ex.name}
                        onChange={(e) => updateExercise(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        className="input text-xs py-2 text-center"
                        placeholder="3"
                        value={ex.sets}
                        onChange={(e) => updateExercise(i, 'sets', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        className="input text-xs py-2 text-center"
                        placeholder="12"
                        value={ex.reps}
                        onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        className="input text-xs py-2 text-center"
                        placeholder="60"
                        value={ex.restSeconds}
                        onChange={(e) => updateExercise(i, 'restSeconds', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        className="input text-xs py-2"
                        placeholder="—"
                        value={ex.notes}
                        onChange={(e) => updateExercise(i, 'notes', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExercise(i)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                type="submit"
                className="btn-primary text-sm"
                disabled={createWorkout.isPending || updateWorkout.isPending}
              >
                <Save size={14} />
                {createWorkout.isPending || updateWorkout.isPending
                  ? 'Salvando...'
                  : editingId ? 'Salvar alterações' : 'Criar Treino'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workout list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
          Carregando...
        </div>
      ) : personalWorkouts.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center text-gray-400">
          <Dumbbell size={40} className="text-gray-200 mb-3" />
          <p className="font-medium">Nenhum treino personalizado ainda.</p>
          <p className="text-sm mt-1">Clique em "Novo Treino" para começar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {personalWorkouts.map((pw: any) => (
            <div key={pw.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{pw.name}</h3>
                  {pw.description && <p className="text-sm text-gray-400 mt-0.5">{pw.description}</p>}
                  <p className="text-xs text-gray-300 mt-1">
                    Criado em {new Date(pw.createdAt).toLocaleDateString('pt-BR')}
                    {pw.updatedAt !== pw.createdAt &&
                      ` · Editado em ${new Date(pw.updatedAt).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(pw)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                  <button
                    onClick={() => { if (confirm('Excluir este treino?')) deleteWorkout.mutate(pw.id) }}
                    className="text-xs py-1.5 px-3 text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-1 font-medium transition-colors"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {pw.exercises.map((ex: any, i: number) => (
                  <div key={ex.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                    <span className="text-gray-600 truncate">{i + 1}. {ex.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="font-bold text-xs" style={{ color: '#0047AB' }}>{ex.sets}×{ex.reps}</span>
                      <span className="text-gray-400 text-xs">{ex.restSeconds}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
