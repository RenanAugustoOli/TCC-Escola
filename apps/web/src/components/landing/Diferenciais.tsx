import { Dumbbell, UserRound, Wind, BrainCircuit } from 'lucide-react'

const ITEMS = [
  {
    icon: Dumbbell,
    title: 'Equipamentos de última geração',
    desc: 'Estações de musculação e cardio renovadas, com manutenção constante e tecnologia de monitoramento embarcada.',
  },
  {
    icon: UserRound,
    title: 'Personal trainers dedicados',
    desc: 'Profissionais certificados acompanham sua evolução e ajustam o treino conforme seu progresso real.',
  },
  {
    icon: Wind,
    title: 'Ambiente climatizado',
    desc: 'Espaço amplo, ventilado e climatizado o ano todo — treine com conforto em qualquer estação.',
  },
  {
    icon: BrainCircuit,
    title: 'Assistente de nutrição por IA',
    desc: 'No app GymTech, uma IA analisa seus treinos e sugere ajustes na alimentação para acelerar seus resultados.',
    highlight: true,
  },
]

export function Diferenciais() {
  return (
    <section className="py-24 bg-gymtech-mist">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-xl mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-gymtech-blue mb-3">Diferenciais</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gymtech-ink text-balance">
            Estrutura de academia, cabeça de tecnologia
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ITEMS.map(({ icon: Icon, title, desc, highlight }) => (
            <div
              key={title}
              className={`rounded-2xl p-7 transition-shadow ${
                highlight
                  ? 'bg-gymtech-blue text-white shadow-lg shadow-gymtech-blue/25'
                  : 'bg-white border border-gymtech-mist hover:shadow-lg hover:shadow-gymtech-ink/5'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  highlight ? 'bg-white/15' : 'bg-gymtech-blueLight'
                }`}
              >
                <Icon className={`w-6 h-6 ${highlight ? 'text-white' : 'text-gymtech-blue'}`} strokeWidth={2} />
              </div>
              <h3 className={`font-display font-bold text-lg mb-2 ${highlight ? 'text-white' : 'text-gymtech-ink'}`}>
                {title}
              </h3>
              <p className={`text-sm leading-relaxed ${highlight ? 'text-white/80' : 'text-gymtech-slate'}`}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
