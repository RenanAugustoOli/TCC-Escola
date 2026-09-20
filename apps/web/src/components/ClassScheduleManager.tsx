'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ClassSchedule, User } from '@academia/shared'
import { WEEKDAY_LABELS, getErrorMessage } from '@/lib/agenda'

interface FormState {
  name: string
  instructorId: string
  weekday: string
  startTime: string
  durationMinutes: string
  capacity: string
}

const EMPTY_FORM: FormState = {
  name: '',
  instructorId: '',
  weekday: '1',
  startTime: '07:00',
  durationMinutes: '45',
  capacity: '15',
}

export function ClassScheduleManager() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: schedules = [] } = useQuery<ClassSchedule[]>({
    queryKey: ['class-schedules'],
    queryFn: () => api.get('/classes').then((r) => r.data),
  })

  const { data: trainers = [] } = useQuery<User[]>({
    queryKey: ['trainers'],
    queryFn: () =>
      api.get('/users', { params: { perPage: 100, role: 'PERSONAL_TRAINER' } }).then((r) => r.data.data as User[]),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['class-schedules'] })
    queryClient.invalidateQueries({ queryKey: ['agenda'] })
  }

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingId ? api.put(`/classes/${editingId}`, payload) : api.post('/classes', payload),
    onSuccess: () => {
      refresh()
      setForm(EMPTY_FORM)
      setEditingId(null)
    },
  })

  const toggleActive = useMutation({
    mutationFn: (schedule: ClassSchedule) =>
      api.put(`/classes/${schedule.id}`, {
        name: schedule.name,
        description: schedule.description ?? undefined,
        instructorId: schedule.instructorId,
        weekday: schedule.weekday,
        startTime: schedule.startTime,
        durationMinutes: schedule.durationMinutes,
        capacity: schedule.capacity,
        isActive: !schedule.isActive,
      }),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: refresh,
  })

  const startEditing = (schedule: ClassSchedule) => {
    setEditingId(schedule.id)
    setForm({
      name: schedule.name,
      instructorId: schedule.instructorId,
      weekday: String(schedule.weekday),
      startTime: schedule.startTime,
      durationMinutes: String(schedule.durationMinutes),
      capacity: String(schedule.capacity),
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    save.mutate({
      name: form.name,
      instructorId: form.instructorId,
      weekday: Number(form.weekday),
      startTime: form.startTime,
      durationMinutes: Number(form.durationMinutes),
      capacity: Number(form.capacity),
    })
  }

  const error = save.error ?? toggleActive.error ?? remove.error

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="font-bold text-gray-900">Turmas</h2>
        <p className="text-xs text-gray-400 mt-0.5">Horário semanal recorrente de cada aula</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
        <input required className="input" placeholder="Nome da aula" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select required className="input" value={form.instructorId}
          onChange={(e) => setForm({ ...form, instructorId: e.target.value })}>
          <option value="">Instrutor</option>
          {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="input" value={form.weekday}
          onChange={(e) => setForm({ ...form, weekday: e.target.value })}>
          {WEEKDAY_LABELS.map((label, i) => <option key={label} value={i}>{label}</option>)}
        </select>
        <input required type="time" className="input" value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        <input required type="number" min="1" className="input" placeholder="Duração (min)" value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
        <input required type="number" min="1" className="input" placeholder="Capacidade" value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <div className="col-span-3 flex gap-2">
          <button type="submit" disabled={save.isPending} className="btn-primary text-xs">
            {editingId ? 'Salvar alterações' : 'Criar turma'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary text-xs"
              onClick={() => { setEditingId(null); setForm(EMPTY_FORM) }}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <table className="w-full text-sm">
        <thead className="border-b border-gray-100">
          <tr>
            <th className="table-header">Aula</th>
            <th className="table-header">Dia</th>
            <th className="table-header">Horário</th>
            <th className="table-header">Instrutor</th>
            <th className="table-header">Vagas</th>
            <th className="table-header">Status</th>
            <th className="px-6 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {schedules.map((s) => (
            <tr key={s.id} className="table-row">
              <td className="px-6 py-3 font-semibold text-gray-900">{s.name}</td>
              <td className="px-6 py-3 text-gray-600">{WEEKDAY_LABELS[s.weekday]}</td>
              <td className="px-6 py-3 text-gray-600">{s.startTime} · {s.durationMinutes} min</td>
              <td className="px-6 py-3 text-gray-600">{s.instructor?.name}</td>
              <td className="px-6 py-3 text-gray-600">{s.capacity}</td>
              <td className="px-6 py-3">
                <span className={s.isActive ? 'badge-active' : 'badge-inactive'}>
                  {s.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </td>
              <td className="px-6 py-3">
                <div className="flex gap-2 justify-end text-xs font-medium">
                  <button onClick={() => startEditing(s)} className="text-primary-600 hover:bg-primary-50 rounded-lg px-2 py-1">
                    Editar
                  </button>
                  <button onClick={() => toggleActive.mutate(s)} className="text-amber-600 hover:bg-amber-50 rounded-lg px-2 py-1">
                    {s.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Remover a turma ${s.name}? As reservas dela também serão apagadas.`)) remove.mutate(s.id) }}
                    className="text-red-600 hover:bg-red-50 rounded-lg px-2 py-1"
                  >
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
