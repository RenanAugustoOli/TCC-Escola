import { Instagram, Facebook, Youtube, Zap } from 'lucide-react'

const LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Modalidades', href: '#modalidades' },
  { label: 'Planos', href: '#planos' },
  { label: 'Matricule-se', href: '#matricula' },
]

// TODO: dado real — links das redes sociais
const SOCIAL = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
]

export function Footer() {
  return (
    <footer id="contato" className="bg-gymtech-ink text-white/60 py-14">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 font-display font-extrabold text-lg text-white mb-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gymtech-blue">
                <Zap className="w-4 h-4" strokeWidth={2.5} />
              </span>
              GymTech
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Treine com tecnologia. Estrutura completa, equipe especializada e um app que evolui com você.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">Navegação</h4>
            <ul className="flex flex-col gap-2 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">Contato</h4>
            {/* TODO: dado real — telefone e e-mail de contato */}
            <ul className="flex flex-col gap-2 text-sm mb-5">
              <li>contato@gymtech.com.br</li>
              <li>(11) 4002-8922</li>
            </ul>
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-gymtech-blue transition-colors"
                >
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-xs text-center sm:text-left">
          © {new Date().getFullYear()} GymTech. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
