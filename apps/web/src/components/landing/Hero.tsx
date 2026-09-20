import { ArrowRight, Sparkles } from 'lucide-react'
import { PulseTrace } from './PulseTrace'

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative pt-16 overflow-hidden bg-gymtech-ink"
    >
      {/* TODO: dado real — trocar o gradiente por foto do salão de musculação em '/img/hero-academia.jpg' */}
      <div
        className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-gymtech-blue/30 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-gymtech-blue/20 blur-[100px]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gymtech-ink/40 via-gymtech-ink/70 to-gymtech-ink" aria-hidden="true" />

      {/* Textura de grid tecnológico — sutil, some nas bordas, quase parada por padrão */}
      <div
        className="absolute inset-0 opacity-[0.07] motion-safe:animate-grid-drift [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <PulseTrace tone="white" className="absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 opacity-40" />

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-24 md:py-36 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="text-white/90 text-xs font-semibold tracking-wide">
            Novo: assistente de nutrição por IA no app GymTech
          </span>
        </div>

        <h1 className="font-display font-black text-white text-4xl sm:text-5xl md:text-6xl leading-[1.08] tracking-tight mb-6 text-balance">
          Treine com tecnologia.
          <br />
          Evolua de verdade.
        </h1>

        <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Equipamentos de última geração, personal trainers de verdade e um app próprio que acompanha
          cada treino e cada refeição. Sua matrícula começa em menos de 2 minutos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#matricula"
            className="relative overflow-hidden group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gymtech-blue text-white font-bold text-base shadow-xl shadow-gymtech-blue/40 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gymtech-ink"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <span className="relative">Matricule-se agora</span>
            <ArrowRight className="relative w-4 h-4" strokeWidth={2.5} />
          </a>
          <a
            href="#planos"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-white/25 text-white font-bold text-base hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Ver planos
          </a>
        </div>
      </div>
    </section>
  )
}
