'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { AgendaItem, User } from '@academia/shared'
import { Search, X } from 'lucide-react'
import { ClassScheduleManager } from '@/components/ClassScheduleManager'
import { formatAgendaDate, formatTime, getErrorMessage, groupAgendaByDate } from '@/lib/agenda'

export default function AulasPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState<User | null>(null)

  const { data: agenda = [], isLoading } = useQuery<AgendaItem[]>({
    queryKey: ['agenda'],
    queryFn: () => api.get('/classes/agenda').then((r) => r.data),
  })

  const { data: matches = [] } = useQuery<User[]>({
    queryKey: ['student-search', search],
    enabled: search.length >= 2,
    queryFn: () =>
      api.get('/users', { params: { search, perPage: 8, role: 'MEMBER' } }).then((r) => r.data.data as User[]),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['agenda'] })

  const book = useMutation({
    mutationFn: (item: AgendaItem) =>
      api.post(`/classes/${item.scheduleId}/bookings`, { date: item.date, userId: student?.id }),
    onSuccess: refresh,
  })

  const cancel = useMutation({
    mutationFn: (bookingId: string) => api.delete(`/classes/bookings/${bookingId}`),
    onSuccess: refresh,
  })

  const error = book.error ?? cancel.error
  const groups = groupAgendaByDate(agenda)

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Aulas</h1>
        <p className="page-subtitle">Agenda dos próximos 7 dias e reservas em nome dos alunos</p>
      </div>

      <div className="card mb-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Reservar para o aluno</p>
        {student ? (
          <div className="flex items-center justify-between bg-primary-50 rounded-xl px-4 py-2.5">
            <span className="text-sm font-semibold text-gray-900">{student.name}</span>
            <button onClick={() => setStudent(null)} className="text-gray-400 hover:text-gray-600" aria-label="Trocar aluno">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-10" placeholder="Buscar aluno por nome ou e-mail..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
            {matches.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                {matches.map((u) => (
                  <li key={u.id}>
                    <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
                      onClick={() => { setStudent(u); setSearch('') }}>
                      <span className="font-semibold text-gray-900">{u.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-gray-400 text-sm">Carregando...</div>
      ) : groups.length === 0 ? (
        <div className="card p-16 text-center text-gray-400 text-sm">Nenhuma aula nos próximos 7 dias.</div>
      ) : (
        <div className="space-y-8 mb-8">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {formatAgendaDate(group.date)}
              </h2>
              <div className="grid grid-cols-2 gap-5">
                {group.items.map((item) => {
                  const started = new Date(item.startsAt) <= new Date()
                  const full = item.spotsLeft === 0
                  return (
                    <div key={`${item.scheduleId}-${item.date}`} className="card flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                          {item.bookedCount} / {item.capacity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-4">
                        {formatTime(item.startsAt)} · {item.durationMinutes} min · {item.instructor.name}
                      </p>
                      <ul className="space-y-1.5 mb-4 flex-1">
                        {(item.bookings ?? []).map((b) => (
                          <li key={b.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                            <span className="text-gray-600">{b.userName}</span>
                            <button onClick={() => cancel.mutate(b.id)} disabled={cancel.isPending}
                              className="text-xs text-red-600 hover:underline">
                              Cancelar
                            </button>
                          </li>
                        ))}
                        {(item.bookings ?? []).length === 0 && (
                          <li className="text-xs text-gray-400">Nenhuma reserva ainda.</li>
                        )}
                      </ul>
                      <button
                        onClick={() => book.mutate(item)}
                        disabled={!student || started || full || book.isPending}
                        className="btn-primary w-full text-sm"
                      >
                        {started ? 'Aula encerrada' : full ? 'Aula lotada' : student ? `Reservar para ${student.name}` : 'Escolha um aluno acima'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {isAdmin && <ClassScheduleManager />}
    </div>
  )
}
