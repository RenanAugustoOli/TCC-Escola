'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { CheckCircle, Clock, XCircle, DollarSign, Receipt, AlertCircle } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-inactive', PAID: 'badge-active', FAILED: 'badge-overdue', REFUNDED: 'badge-cancelled',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente', PAID: 'Pago', FAILED: 'Falhou', REFUNDED: 'Estornado',
}
const METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX', CREDIT_CARD: 'Cartão de Crédito', BOLETO: 'Boleto',
}

export default function PagamentosMembroPage() {
  const { user } = useAuth()

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => api.get(`/users/${user?.id}/subscriptions`).then((r) => r.data),
    enabled: !!user,
  })

  const allPayments = subscriptions
    .flatMap((s: any) => (s.payments ?? []).map((p: any) => ({ ...p, plan: s.plan })))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalPaid = allPayments
    .filter((p: any) => p.status === 'PAID')
    .reduce((acc: number, p: any) => acc + p.amount, 0)

  const paidCount = allPayments.filter((p: any) => p.status === 'PAID').length
  const pendingCount = allPayments.filter((p: any) => p.status === 'PENDING').length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Meus Pagamentos</h1>
        <p className="page-subtitle">Histórico completo de cobranças</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="card flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-50 text-primary-600">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total pago</p>
            <p className="text-2xl font-black text-gray-900">
              {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
        <div className="card flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
            <Receipt size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Pagamentos</p>
            <p className="text-2xl font-black text-gray-900">{paidCount}</p>
          </div>
        </div>
        <div className="card flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Pendentes</p>
            <p className="text-2xl font-black text-gray-900">{pendingCount}</p>
          </div>
        </div>
      </div>

      {allPayments.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">Nenhum pagamento registrado.</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Plano</th>
                <th className="table-header">Valor</th>
                <th className="table-header">Método</th>
                <th className="table-header">Status</th>
                <th className="table-header">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allPayments.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="px-6 py-4 font-semibold text-gray-900">{p.plan?.name ?? '—'}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{METHOD_LABEL[p.method]}</td>
                  <td className="px-6 py-4">
                    <span className={`${STATUS_BADGE[p.status]} flex items-center gap-1 w-fit`}>
                      {p.status === 'PAID' && <CheckCircle size={11} />}
                      {p.status === 'PENDING' && <Clock size={11} />}
                      {(p.status === 'FAILED' || p.status === 'REFUNDED') && <XCircle size={11} />}
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
