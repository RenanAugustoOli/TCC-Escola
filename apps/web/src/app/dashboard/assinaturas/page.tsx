'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Subscription } from '@academia/shared'
import { Search, RefreshCw, XCircle } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa', INACTIVE: 'Inativa', CANCELLED: 'Cancelada', OVERDUE: 'Inadimplente',
}
const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-active', INACTIVE: 'badge-inactive', CANCELLED: 'badge-cancelled', OVERDUE: 'badge-overdue',
}

export default function AssinaturasPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', page, search, status],
    queryFn: () =>
      api.get('/subscriptions', {
        params: { page, perPage: 20, search: search || undefined, status: status || undefined },
      }).then((r) => r.data),
  })

  const subs: (Subscription & { user: { name: string; email: string }; plan: { name: string } })[] = data?.data ?? []

  const cancel = useMutation({
    mutationFn: (id: string) => api.put(`/subscriptions/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  })

  const renew = useMutation({
    mutationFn: (id: string) => api.put(`/subscriptions/${id}/renew`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Assinaturas</h1>
        <p className="page-subtitle">{data?.total ?? 0} assinaturas no total</p>
      </div>

      <div className="card mb-5 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Buscar por aluno..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input w-44"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativas</option>
          <option value="OVERDUE">Inadimplentes</option>
          <option value="CANCELLED">Canceladas</option>
          <option value="INACTIVE">Inativas</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-16 text-gray-400 text-sm">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
            Carregando...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Aluno</th>
                <th className="table-header">Plano</th>
                <th className="table-header">Status</th>
                <th className="table-header">Vencimento</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subs.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{s.user?.name}</p>
                    <p className="text-xs text-gray-400">{s.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.plan?.name}</td>
                  <td className="px-6 py-4">
                    <span className={STATUS_BADGE[s.status]}>{STATUS_LABELS[s.status]}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(s.endDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => renew.mutate(s.id)}
                        className="text-xs py-1.5 px-3 text-primary-600 hover:bg-primary-50 rounded-lg flex items-center gap-1 font-medium transition-colors"
                      >
                        <RefreshCw size={12} />
                        Renovar
                      </button>
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => cancel.mutate(s.id)}
                          className="text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 font-medium transition-colors"
                        >
                          <XCircle size={12} />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(data?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3">
              ← Anterior
            </button>
            <span className="text-xs text-gray-500">Página {page} de {data?.totalPages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === data?.totalPages} className="btn-secondary text-xs py-1.5 px-3">
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
