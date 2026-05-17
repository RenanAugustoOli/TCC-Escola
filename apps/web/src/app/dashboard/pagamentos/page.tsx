'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CheckCircle } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-inactive', PAID: 'badge-active', FAILED: 'badge-overdue', REFUNDED: 'badge-cancelled',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente', PAID: 'Pago', FAILED: 'Falhou', REFUNDED: 'Estornado',
}
const METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX', CREDIT_CARD: 'Cartão de Crédito', BOLETO: 'Boleto',
}

export default function PagamentosPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, status],
    queryFn: () =>
      api.get('/payments', { params: { page, perPage: 20, status: status || undefined } }).then((r) => r.data),
  })

  const confirm = useMutation({
    mutationFn: (id: string) => api.put(`/payments/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })

  const payments = data?.data ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Pagamentos</h1>
        <p className="page-subtitle">Histórico e confirmação de pagamentos</p>
      </div>

      <div className="card mb-5 flex gap-3">
        <select
          className="input w-48"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="PAID">Pagos</option>
          <option value="FAILED">Com falha</option>
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
                <th className="table-header">Valor</th>
                <th className="table-header">Método</th>
                <th className="table-header">Status</th>
                <th className="table-header">Data</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{p.subscription?.user?.name}</p>
                    <p className="text-xs text-gray-400">{p.subscription?.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.subscription?.plan?.name}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{METHOD_LABEL[p.method]}</td>
                  <td className="px-6 py-4">
                    <span className={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'PENDING' && (
                      <button
                        onClick={() => confirm.mutate(p.id)}
                        className="text-xs py-1.5 px-3 text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-medium transition-colors ml-auto"
                      >
                        <CheckCircle size={12} />
                        Confirmar
                      </button>
                    )}
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
