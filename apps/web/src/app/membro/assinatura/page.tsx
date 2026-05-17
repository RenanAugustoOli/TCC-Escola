'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { AlertCircle, CheckCircle, Clock, CreditCard } from 'lucide-react'

function getDaysLeft(endDate: string) {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000))
}

function getColors(days: number, status: string) {
  if (status !== 'ACTIVE') return { bar: 'bg-gray-200', num: 'text-gray-400' }
  if (days <= 7)  return { bar: 'bg-red-500',    num: 'text-red-600' }
  if (days <= 15) return { bar: 'bg-amber-500',  num: 'text-amber-600' }
  return { bar: 'bg-primary-600', num: 'text-primary-600' }
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-active', INACTIVE: 'badge-inactive',
  CANCELLED: 'badge-cancelled', OVERDUE: 'badge-overdue',
}
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativa', INACTIVE: 'Inativa', CANCELLED: 'Cancelada', OVERDUE: 'Inadimplente',
}

export default function MinhaAssinaturaPage() {
  const { user } = useAuth()
  const [paySuccess, setPaySuccess] = useState(false)

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => api.get(`/users/${user?.id}/subscriptions`).then((r) => r.data),
    enabled: !!user,
  })

  const generatePayment = useMutation({
    mutationFn: ({ subscriptionId, method }: { subscriptionId: string; method: string }) =>
      api.post('/payments/generate', { subscriptionId, method }),
    onSuccess: () => setPaySuccess(true),
  })

  const activeSub = subscriptions.find((s: any) => s.status === 'ACTIVE')
  const otherSubs = subscriptions.filter((s: any) => s.status !== 'ACTIVE')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
        Carregando...
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Minha Assinatura</h1>
        <p className="page-subtitle">Acompanhe o status e o vencimento da sua assinatura</p>
      </div>

      {activeSub ? (() => {
        const daysLeft = getDaysLeft(activeSub.endDate)
        const totalDays = activeSub.plan.durationDays
        const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100))
        const clr = getColors(daysLeft, activeSub.status)

        return (
          <div className="card">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Plano atual</p>
                <h2 className="text-2xl font-black text-gray-900">{activeSub.plan.name}</h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {activeSub.plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  {' / '}{activeSub.plan.durationDays} dias
                </p>
              </div>
              <span className="badge-active flex items-center gap-1">
                <CheckCircle size={12} /> Ativa
              </span>
            </div>

            {/* Countdown */}
            <div className="rounded-2xl p-5 mb-6 border border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock size={15} />
                  <span className="text-sm font-medium">Tempo restante</span>
                </div>
                <span className={`text-4xl font-black tracking-tight ${clr.num}`}>
                  {daysLeft}<span className="text-lg font-semibold ml-1">{daysLeft === 1 ? 'dia' : 'dias'}</span>
                </span>
              </div>

              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${clr.bar}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Início: {new Date(activeSub.startDate).toLocaleDateString('pt-BR')}</span>
                <span>Vence: {new Date(activeSub.endDate).toLocaleDateString('pt-BR')}</span>
              </div>

              {daysLeft <= 7 && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={14} />
                  Sua assinatura vence em breve. Renove agora para não perder o acesso.
                </div>
              )}
            </div>

            {/* Benefícios */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Benefícios incluídos</p>
              <div className="grid grid-cols-2 gap-2">
                {activeSub.plan.features.map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Pagamento */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Renovar / Pagar</p>
              <div className="flex gap-3">
                {[
                  { key: 'PIX', label: 'PIX' },
                  { key: 'BOLETO', label: 'Boleto' },
                  { key: 'CREDIT_CARD', label: 'Cartão' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setPaySuccess(false); generatePayment.mutate({ subscriptionId: activeSub.id, method: key }) }}
                    disabled={generatePayment.isPending}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <CreditCard size={14} />
                    {label}
                  </button>
                ))}
              </div>
              {paySuccess && (
                <p className="text-xs text-emerald-600 mt-3 text-center flex items-center justify-center gap-1.5">
                  <CheckCircle size={13} /> Pagamento gerado com sucesso!
                </p>
              )}
            </div>
          </div>
        )
      })() : (
        <div className="card flex flex-col items-center py-16 text-center">
          <AlertCircle size={48} className="text-gray-200 mb-4" />
          <h2 className="text-lg font-bold text-gray-700">Nenhuma assinatura ativa</h2>
          <p className="text-gray-400 text-sm mt-1">Consulte os planos disponíveis para se cadastrar.</p>
          <a href="/membro/planos" className="btn-primary mt-6 text-sm">Ver Planos</a>
        </div>
      )}

      {otherSubs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Histórico</h2>
          <div className="space-y-3">
            {otherSubs.map((s: any) => (
              <div key={s.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{s.plan.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.startDate).toLocaleDateString('pt-BR')} — {new Date(s.endDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={STATUS_BADGE[s.status]}>{STATUS_LABEL[s.status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
