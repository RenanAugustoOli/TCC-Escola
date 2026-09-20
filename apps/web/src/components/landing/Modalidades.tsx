import { Dumbbell, Flame, Zap, Users, Waves, Infinity as InfinityIcon } from 'lucide-react'

// TODO: dado real — trocar os cards por fotos das modalidades quando disponíveis
const MODALIDADES = [
  { title: 'Musculação', desc: 'Treino de força livre e guiado, com acompanhamento técnico completo.', icon: Dumbbell },
  { title: 'Funcional', desc: 'Movimentos multiarticulares que melhoram força, mobilidade e resistência.', icon: Flame },
  { title: 'Cross Training', desc: 'Treinos de alta intensidade que combinam força, cardio e ginástica.', icon: Zap },
  { title: 'Aulas coletivas', desc: 'Spinning, jump e dança fitness em turmas guiadas por instrutores.', icon: Users },
  { title: 'Yoga & Mobilidade', desc: 'Alongamento, respiração e recuperação ativa para equilibrar a rotina de treinos.', icon: Waves },
  { title: 'Treino livre', desc: 'Acesso total à área de peso livre e máquinas, sem hora marcada.', icon: InfinityIcon },
]

export function Modalidades() {
  return (
    <section id="modalidades" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-xl mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-gymtech-blue mb-3">Modalidades</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gymtech-ink text-balance">
            Um treino para cada objetivo
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODALIDADES.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] p-6 flex flex-col justify-end bg-gymtech-ink transition-transform duration-300 hover:-translate-y-1"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-gymtech-blue/25 via-gymtech-ink to-gymtech-ink transition-transform duration-500 group-hover:scale-105"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 opacity-[0.06] [mask-image:radial-gradient(ellipse_at_bottom_left,black,transparent_70%)]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
                aria-hidden="true"
              />
              <Icon
                className="relative w-9 h-9 text-white/90 mb-4 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h3 className="relative font-display font-bold text-white text-lg mb-1">{title}</h3>
              <p className="relative text-white/70 text-sm leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
