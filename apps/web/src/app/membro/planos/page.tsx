'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plan } from '@academia/shared'
import { Check, Star } from 'lucide-react'

export default function PlanosMembroPage() {
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Planos disponíveis</h1>
        <p className="page-subtitle">Escolha o plano ideal para seus objetivos</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {plans.map((plan, idx) => {
            const isPopular = idx === 1
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                  isPopular
                    ? 'shadow-xl shadow-primary-100/50'
                    : 'border border-gray-100 shadow-sm'
                }`}
                style={isPopular ? { backgroundColor: '#0047AB' } : { backgroundColor: '#fff' }}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-400 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow">
                      <Star size={10} fill="currentColor" /> MAIS POPULAR
                    </span>
                  </div>
                )}

                <h3 className={`text-lg font-bold mb-1 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className={`text-sm mb-4 ${isPopular ? 'text-blue-200' : 'text-gray-400'}`}>
                    {plan.description}
                  </p>
                )}

                <div className="mb-5 flex items-end gap-1">
                  <span className={`text-4xl font-black ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className={`text-sm mb-1 ${isPopular ? 'text-blue-300' : 'text-gray-400'}`}>
                    /{plan.durationDays}d
                  </span>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-sm ${isPopular ? 'text-blue-100' : 'text-gray-600'}`}>
                      <Check
                        size={14}
                        className={`flex-shrink-0 mt-0.5 ${isPopular ? 'text-blue-300' : 'text-emerald-500'}`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <p className={`text-xs text-center mt-5 pt-4 border-t ${isPopular ? 'border-white/20 text-blue-300' : 'border-gray-100 text-gray-400'}`}>
                  Para alterar seu plano, fale com a recepção
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
