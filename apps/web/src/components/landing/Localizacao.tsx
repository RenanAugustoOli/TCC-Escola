import { Clock, MapPin } from 'lucide-react'

// TODO: dado real — endereço e horários de funcionamento
const HORARIOS = [
  { dias: 'Segunda a sexta', horas: '06h00 – 23h00' },
  { dias: 'Sábados', horas: '08h00 – 18h00' },
  { dias: 'Domingos e feriados', horas: '08h00 – 14h00' },
]

export function Localizacao() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gymtech-blue mb-3">
            Localização e horários
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gymtech-ink text-balance mb-8">
            Venha treinar de perto
          </h2>

          <div className="flex items-start gap-3 mb-6">
            <MapPin className="w-5 h-5 text-gymtech-blue shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-sm text-gymtech-slate leading-relaxed">
              {/* TODO: dado real */}
              Av. Paulista, 1500 — Bela Vista
              <br />
              São Paulo, SP — CEP 01310-100
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gymtech-blue shrink-0 mt-0.5" strokeWidth={2} />
            <dl className="text-sm text-gymtech-slate space-y-1.5">
              {HORARIOS.map((h) => (
                <div key={h.dias} className="flex gap-2">
                  <dt className="font-semibold text-gymtech-ink">{h.dias}:</dt>
                  <dd>{h.horas}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* TODO: dado real — trocar por iframe do Google Maps com o endereço definitivo */}
        <div className="rounded-2xl overflow-hidden border border-gymtech-mist aspect-[4/3] bg-gymtech-mist flex items-center justify-center">
          <div className="text-center px-6">
            <MapPin className="w-8 h-8 text-gymtech-blue mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-gymtech-slate">Mapa da localização (placeholder)</p>
          </div>
        </div>
      </div>
    </section>
  )
}
