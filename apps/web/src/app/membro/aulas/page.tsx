'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AgendaItem } from '@academia/shared'
import { CalendarDays, Clock, User } from 'lucide-react'
import { formatAgendaDate, formatTime, getErrorMessage, groupAgendaByDate } from '@/lib/agenda'

export default function AulasMembroPage() {
  const queryClient = useQueryClient()

  const { data: agenda = [], isLoading } = useQuery<AgendaItem[]>({
    queryKey: ['agenda'],
    queryFn: () => api.get('/classes/agenda').then((r) => r.data),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['agenda'] })

  const book = useMutation({
    mutationFn: (item: AgendaItem) => api.post(`/classes/${item.scheduleId}/bookings`, { date: item.date }),
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
      <div className="page-header">
        <h1 className="page-title">Aulas</h1>
        <p className="page-subtitle">Reserve sua vaga nas aulas dos próximos 7 dias</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-gray-400 text-sm">Carregando...</div>
      ) : groups.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <CalendarDays size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma aula nos próximos 7 dias.</p>
        </div>
      ) : (
        <div className="space-y-8">
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
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                          {item.spotsLeft} de {item.capacity} vagas
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {formatTime(item.startsAt)} · {item.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User size={13} />
                          {item.instructor.name}
                        </span>
                      </div>
                      {item.bookedByMe ? (
                        <button
                          onClick={() => item.myBookingId && cancel.mutate(item.myBookingId)}
                          disabled={started || cancel.isPending}
                          className="btn-secondary w-full text-sm"
                        >
                          Cancelar reserva
                        </button>
                      ) : (
                        <button
                          onClick={() => book.mutate(item)}
                          disabled={started || full || book.isPending}
                          className="btn-primary w-full text-sm"
                        >
                          {started ? 'Aula encerrada' : full ? 'Aula lotada' : 'Reservar vaga'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
