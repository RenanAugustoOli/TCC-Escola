'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

// TODO: dado real — valores e vigência dos planos
const PLANS = [
  {
    name: 'Mensal',
    monthly: 129.9,
    annualMonthly: null as number | null,
    desc: 'Flexibilidade total, sem fidelidade.',
    features: ['Acesso ilimitado à academia', 'App com assistente de nutrição IA', 'Aulas coletivas inclusas'],
    popular: false,
  },
  {
    name: 'Trimestral',
    monthly: 114.9,
    annualMonthly: null as number | null,
    desc: 'O equilíbrio entre economia e compromisso.',
    features: [
      'Acesso ilimitado à academia',
      'App com assistente de nutrição IA',
      'Aulas coletivas inclusas',
      '1 avaliação física gratuita',
    ],
    popular: true,
  },
  {
    name: 'Anual',
    monthly: 99.9,
    annualMonthly: null as number | null,
    desc: 'Máximo desconto para quem já decidiu evoluir.',
    features: [
      'Acesso ilimitado à academia',
      'App com assistente de nutrição IA',
      'Aulas coletivas inclusas',
      'Avaliações físicas trimestrais',
      '1 sessão de personal por mês',
    ],
    popular: false,
  },
]

const ANNUAL_DISCOUNT = 0.8 // -20% no plano anual

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function Planos() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="planos" className="py-24 bg-gymtech-ink relative overflow-hidden">
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gymtech-blue/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">Planos</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white text-balance mb-4">
            Escolha como quer treinar
          </h2>
          <p className="text-white/60 text-sm">Sem taxa de matrícula. Cancele quando quiser.</p>
        </div>

        {/* Toggle Mensal / Anual */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <span className={`text-sm font-semibold transition-colors ${!annual ? 'text-white' : 'text-white/40'}`}>
            Mensal
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Alternar cobrança entre mensal e anual"
            onClick={() => setAnnual((v) => !v)}
            className="relative w-14 h-8 rounded-full bg-white/10 border border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-gymtech-blue shadow-md transition-transform duration-300 ${
                annual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-semibold transition-colors ${annual ? 'text-white' : 'text-white/40'}`}>
            Anual
          </span>
          <span className="ml-1 text-xs font-bold text-gymtech-success bg-gymtech-success/15 px-2 py-1 rounded-full">
            -20%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = annual ? plan.monthly * ANNUAL_DISCOUNT : plan.monthly
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl p-8 backdrop-blur-xl border transition-transform hover:-translate-y-1 ${
                  plan.popular
                    ? 'bg-white/15 border-white/30 shadow-2xl shadow-gymtech-blue/30 md:scale-105'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold text-gymtech-ink bg-white px-4 py-1.5 rounded-full shadow">
                    Mais popular
                  </span>
                )}

                <h3 className="font-display font-bold text-xl text-white mb-1">{plan.name}</h3>
                <p className="text-white/60 text-sm mb-6">{plan.desc}</p>

                <div className="flex items-end gap-1 mb-6">
                  <span className="font-display font-black text-4xl text-white tabular-nums">
                    {formatBRL(price)}
                  </span>
                  <span className="text-white/50 text-sm mb-1.5">/mês</span>
                </div>

                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-gymtech-success" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#matricula"
                  className={`relative overflow-hidden group text-center py-3 rounded-full font-bold text-sm transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                    plan.popular ? 'bg-white text-gymtech-ink' : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
                  <span className="relative">Quero este plano</span>
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
