'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Básico',
    price: 'R$ 89,90',
    period: '30 dias',
    description: 'Ideal para quem está começando',
    features: ['Acesso à academia', 'Treinos padrão', 'App mobile', 'Suporte por e-mail'],
    highlight: false,
  },
  {
    name: 'Premium',
    price: 'R$ 149,90',
    period: '30 dias',
    description: 'Para quem quer resultados mais rápidos',
    features: ['Acesso à academia', 'Treinos personalizados', 'App mobile', 'Personal trainer', 'Suporte prioritário'],
    highlight: true,
  },
  {
    name: 'Anual',
    price: 'R$ 999,90',
    period: '365 dias',
    description: 'Melhor custo-benefício do ano',
    features: ['Acesso à academia', 'Treinos personalizados', 'App mobile', 'Personal trainer', 'Suporte 24/7', 'Avaliação física mensal'],
    highlight: false,
  },
]

const FEATURES = [
  {
    icon: '🏋️',
    title: 'Treinos Personalizados',
    desc: 'Personal trainers criam planos exclusivos para o seu objetivo e nível de condicionamento.',
  },
  {
    icon: '📱',
    title: 'App Mobile',
    desc: 'Acompanhe seus treinos, assinatura e progresso pelo celular em qualquer lugar.',
  },
  {
    icon: '💳',
    title: 'Pagamento Fácil',
    desc: 'PIX, boleto ou cartão de crédito. Renove sua assinatura com um clique.',
  },
  {
    icon: '📊',
    title: 'Acompanhamento Real',
    desc: 'Visualize seu histórico de treinos e evolução ao longo do tempo.',
  },
  {
    icon: '👨‍💼',
    title: 'Equipe Especializada',
    desc: 'Profissionais certificados prontos para te apoiar em cada etapa.',
  },
  {
    icon: '🔒',
    title: 'Plataforma Segura',
    desc: 'Seus dados e pagamentos protegidos com a mais alta tecnologia de segurança.',
  },
]

const STATS = [
  { value: '500+', label: 'Alunos ativos' },
  { value: '15+', label: 'Personal trainers' },
  { value: '60+', label: 'Modalidades de treino' },
  { value: '5', label: 'Anos de excelência' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-lg"
              style={{ backgroundColor: '#0047AB' }}
            >
              G
            </div>
            <span className="text-xl font-black" style={{ color: '#0047AB' }}>GymTech</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Início', 'Recursos', 'Planos', 'Contato'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace('í', 'i')}`}
                className="text-gray-600 hover:text-[#0047AB] font-medium text-sm transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#0047AB] text-[#0047AB] hover:bg-cobalt-50 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0047AB' }}
            >
              Começar agora
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span className={`block h-0.5 bg-gray-600 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-gray-600 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-gray-600 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-3">
            {['Início', 'Recursos', 'Planos', 'Contato'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace('í', 'i')}`}
                className="text-gray-700 font-medium py-1"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <Link href="/login" className="text-center py-2.5 rounded-lg border border-[#0047AB] text-[#0047AB] font-semibold text-sm">
                Entrar
              </Link>
              <Link href="/login" className="text-center py-2.5 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: '#0047AB' }}>
                Começar agora
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="inicio" className="relative pt-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0047AB 0%, #003d92 50%, #001f52 100%)' }}>
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-sm font-medium">Plataforma completa para sua academia</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            Transforme seu corpo,
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #93c5fd, #bfdbfe)' }}>
              transforme sua vida
            </span>
          </h1>

          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gerencie sua assinatura, acompanhe treinos personalizados e evolua com o suporte de personal trainers especializados — tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[#0047AB] bg-white font-bold text-base hover:bg-blue-50 transition-colors shadow-lg shadow-black/20"
            >
              Começar agora
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#planos"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 transition-colors"
            >
              Ver planos
            </a>
          </div>
        </div>

        {/* bottom wave */}
        <div className="relative h-16 overflow-hidden">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="white">
            <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-black mb-1" style={{ color: '#0047AB' }}>{s.value}</p>
                <p className="text-gray-500 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gray-100" />
      </div>

      {/* FEATURES */}
      <section id="recursos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#0047AB' }}>Recursos</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              A GymTech reúne gestão de assinaturas, treinos e acompanhamento profissional numa plataforma simples e moderna.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-[#0047AB]/20 hover:shadow-lg hover:shadow-[#0047AB]/5 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: '#e8f0fb' }}
                >
                  {f.icon}
                </div>
                <h3 className="text-gray-900 font-bold text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="planos" className="py-24" style={{ backgroundColor: '#f8faff' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#0047AB' }}>Planos</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Planos flexíveis que se adaptam ao seu ritmo e objetivo. Cancele ou altere quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${plan.highlight
                  ? 'text-white shadow-2xl shadow-[#0047AB]/30 scale-105'
                  : 'bg-white border border-gray-100 shadow-sm'
                  }`}
                style={plan.highlight ? { backgroundColor: '#0047AB' } : {}}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-400 text-emerald-900 text-xs font-bold px-4 py-1.5 rounded-full shadow">
                      Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm mb-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke={plan.highlight ? '#93c5fd' : '#0047AB'}
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span className={plan.highlight ? 'text-blue-100' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.highlight
                    ? 'bg-white text-[#0047AB] hover:bg-blue-50'
                    : 'text-white hover:opacity-90'
                    }`}
                  style={!plan.highlight ? { backgroundColor: '#0047AB' } : {}}
                >
                  Assinar agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#0047AB' }}>Como funciona</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Simples assim
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Crie sua conta', desc: 'Faça seu cadastro em minutos e escolha o plano que melhor se encaixa no seu objetivo.' },
              { step: '02', title: 'Agende seus treinos', desc: 'Seu personal trainer monta um plano exclusivo e você acompanha tudo pelo app.' },
              { step: '03', title: 'Evolua e conquiste', desc: 'Registre cada treino concluído e veja sua evolução semana após semana.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-6"
                  style={{ backgroundColor: '#0047AB' }}
                >
                  {item.step}
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0047AB 0%, #001f52 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Pronto para começar sua transformação?
          </h2>
          <p className="text-blue-200 text-base mb-8 max-w-xl mx-auto">
            Junte-se a mais de 500 alunos que já estão evoluindo com a GymTech. Sua primeira semana é por nossa conta.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white font-bold text-base hover:bg-blue-50 transition-colors shadow-lg shadow-black/20"
            style={{ color: '#0047AB' }}
          >
            Quero começar agora
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contato" className="bg-gray-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-lg"
                  style={{ backgroundColor: '#0047AB' }}
                >
                  G
                </div>
                <span className="text-xl font-black text-white">GymTech</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                Plataforma completa de gerenciamento para academias. Assinaturas, treinos e personal trainers em um só lugar.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Plataforma</h4>
              <ul className="flex flex-col gap-2 text-sm">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Entrar</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Contato</h4>
              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  contato@gymtech.com.br
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z" />
                  </svg>
                  (11) 9 9999-0000
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  São Paulo, SP
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} GymTech. Todos os direitos reservados.</p>
            <p>Feito com ❤️ para academias que evoluem</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
