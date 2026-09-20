import { Star } from 'lucide-react'

// TODO: dado real — depoimentos e fotos de alunos (substituir o avatar de iniciais por foto real)
const DEPOIMENTOS = [
  {
    nome: 'Camila Duarte',
    texto:
      'Em 6 meses treinando na GymTech emagreci 12kg. O app com o assistente de nutrição me ajudou muito a entender o que comer nos dias de treino pesado.',
  },
  {
    nome: 'Rafael Nogueira',
    texto:
      'Já treinei em várias academias e a estrutura aqui é outro nível. Equipamento sempre disponível e os personais realmente acompanham a evolução.',
  },
  {
    nome: 'Beatriz Lima',
    texto:
      'Comecei sem nenhuma experiência com musculação. A equipe teve muita paciência comigo e hoje treino sozinha com total confiança.',
  },
]

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function Depoimentos() {
  return (
    <section className="py-24 bg-gymtech-mist">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-xl mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-gymtech-blue mb-3">Depoimentos</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gymtech-ink text-balance">
            Quem treina, recomenda
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEPOIMENTOS.map((d) => (
            <figure key={d.nome} className="bg-white rounded-2xl p-7 border border-gymtech-mist shadow-sm">
              <div className="flex gap-0.5 mb-4" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gymtech-blue text-gymtech-blue" />
                ))}
              </div>
              <blockquote className="text-sm text-gymtech-slate leading-relaxed mb-6">
                “{d.texto}”
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-gymtech-blueLight text-gymtech-blue flex items-center justify-center shrink-0 font-display font-bold text-sm"
                  aria-hidden="true"
                >
                  {iniciais(d.nome)}
                </div>
                <span className="text-sm font-bold text-gymtech-ink">{d.nome}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
