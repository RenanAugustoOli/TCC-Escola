'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Play, Bell, Clock, AlertTriangle } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = {
  PAYMENT_DUE_SOON: 'Cobrança gerada',
  PAYMENT_OVERDUE: 'Pagamento vencido',
  PAYMENT_GENERATED: 'Cobrança gerada',
}
const TYPE_ICON: Record<string, typeof Bell> = {
  PAYMENT_DUE_SOON: Clock,
  PAYMENT_OVERDUE: AlertTriangle,
  PAYMENT_GENERATED: Clock,
}
const TYPE_BADGE: Record<string, string> = {
  PAYMENT_DUE_SOON: 'badge-inactive',
  PAYMENT_OVERDUE: 'badge-overdue',
  PAYMENT_GENERATED: 'badge-inactive',
}

export default function NotificacoesPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['billing-notifications', page],
    queryFn: () => api.get('/billing/notifications', { params: { page, perPage: 20 } }).then((r) => r.data),
  })

  const runCycle = useMutation({
    mutationFn: () => api.post('/billing/run'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-notifications'] }),
  })

  const notifications = data?.data ?? []

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="page-title">Notificações</h1>
          <p className="page-subtitle">Log de cobranças recorrentes e alertas de inadimplência (simulado)</p>
        </div>
        <button
          onClick={() => runCycle.mutate()}
          disabled={runCycle.isPending}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
        >
          <Play size={12} />
          {runCycle.isPending ? 'Rodando...' : 'Rodar ciclo de cobrança agora'}
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-16 text-gray-400 text-sm">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
            Carregando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-gray-400 text-sm gap-2">
            <Bell size={24} className="text-gray-300" />
            Nenhuma notificação registrada ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Tipo</th>
                <th className="table-header">Aluno</th>
                <th className="table-header">Mensagem</th>
                <th className="table-header">Canal</th>
                <th className="table-header">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {notifications.map((n: any) => {
                const Icon = TYPE_ICON[n.type] ?? Bell
                return (
                  <tr key={n.id} className="table-row">
                    <td className="px-6 py-4">
                      <span className={`${TYPE_BADGE[n.type] ?? 'badge-inactive'} flex items-center gap-1 w-fit`}>
                        <Icon size={11} />
                        {TYPE_LABEL[n.type] ?? n.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{n.user?.name}</p>
                      <p className="text-xs text-gray-400">{n.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{n.message}</td>
                    <td className="px-6 py-4 text-gray-500">{n.channel} · {n.status}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
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
