'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const OBJETIVOS = ['Emagrecimento', 'Ganho de massa muscular', 'Condicionamento físico', 'Qualidade de vida']

type Errors = Partial<Record<'nome' | 'email' | 'telefone' | 'objetivo', string>>

export function FormularioMatricula() {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Errors>({})

  function validate(data: FormData): Errors {
    const nome = String(data.get('nome') || '').trim()
    const email = String(data.get('email') || '').trim()
    const telefone = String(data.get('telefone') || '').trim()
    const objetivo = String(data.get('objetivo') || '').trim()

    const next: Errors = {}
    if (nome.length < 3) next.nome = 'Informe seu nome completo.'
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Informe um e-mail válido.'
    if (telefone.replace(/\D/g, '').length < 10) next.telefone = 'Informe um telefone com DDD.'
    if (!objetivo) next.objetivo = 'Selecione seu objetivo.'
    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const validationErrors = validate(data)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setStatus('error')
      return
    }

    setStatus('submitting')
    try {
      // TODO: plugar API real de captação de leads (ex.: POST /api/matriculas)
      // await api.post('/matriculas', Object.fromEntries(data))
      await new Promise((resolve) => setTimeout(resolve, 900))
      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  const fieldClasses = (hasError: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-gymtech-ink placeholder-gymtech-slate/60 bg-white transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-gymtech-danger focus:ring-gymtech-danger/30'
        : 'border-gymtech-mist focus:ring-gymtech-blue/30 focus:border-gymtech-blue'
    }`

  return (
    <section id="matricula" className="py-24 bg-gymtech-mist">
      <div className="max-w-2xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gymtech-blue mb-3">Matrícula</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gymtech-ink text-balance mb-3">
            Dê o primeiro passo hoje
          </h2>
          <p className="text-gymtech-slate text-sm">
            Preencha o formulário e nossa equipe entra em contato em até 1 dia útil.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-3xl border border-gymtech-mist shadow-sm p-7 sm:p-9 flex flex-col gap-5"
        >
          <div>
            <label htmlFor="nome" className="block text-sm font-semibold text-gymtech-ink mb-1.5">
              Nome completo
            </label>
            <input id="nome" name="nome" type="text" autoComplete="name" className={fieldClasses(!!errors.nome)} />
            {errors.nome && <p className="mt-1.5 text-xs font-medium text-gymtech-danger">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gymtech-ink mb-1.5">
                E-mail
              </label>
              <input id="email" name="email" type="email" autoComplete="email" className={fieldClasses(!!errors.email)} />
              {errors.email && <p className="mt-1.5 text-xs font-medium text-gymtech-danger">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="telefone" className="block text-sm font-semibold text-gymtech-ink mb-1.5">
                Telefone
              </label>
              <input
                id="telefone"
                name="telefone"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 99999-0000"
                className={fieldClasses(!!errors.telefone)}
              />
              {errors.telefone && <p className="mt-1.5 text-xs font-medium text-gymtech-danger">{errors.telefone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="objetivo" className="block text-sm font-semibold text-gymtech-ink mb-1.5">
              Seu objetivo
            </label>
            <select id="objetivo" name="objetivo" className={fieldClasses(!!errors.objetivo)} defaultValue="">
              <option value="" disabled>
                Selecione uma opção
              </option>
              {OBJETIVOS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            {errors.objetivo && <p className="mt-1.5 text-xs font-medium text-gymtech-danger">{errors.objetivo}</p>}
          </div>

          <div>
            <label htmlFor="mensagem" className="block text-sm font-semibold text-gymtech-ink mb-1.5">
              Mensagem <span className="font-normal text-gymtech-slate">(opcional)</span>
            </label>
            <textarea
              id="mensagem"
              name="mensagem"
              rows={3}
              className={fieldClasses(false)}
              placeholder="Conte um pouco sobre sua rotina ou experiência com treinos."
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="relative overflow-hidden group mt-2 inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-gymtech-blue text-white font-bold text-sm transition-transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gymtech-blue/40"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <span className="relative flex items-center gap-2">
              {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'submitting' ? 'Enviando...' : 'Quero me matricular'}
            </span>
          </button>

          <div role="status" aria-live="polite">
            {status === 'success' && (
              <div className="flex items-center gap-2 text-sm font-medium text-gymtech-success bg-gymtech-success/10 border border-gymtech-success/20 rounded-xl px-4 py-3 animate-count-in motion-reduce:animate-none">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Recebemos seus dados! Em breve entraremos em contato.
              </div>
            )}
            {status === 'error' && Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium text-gymtech-danger bg-gymtech-danger/10 border border-gymtech-danger/20 rounded-xl px-4 py-3 animate-count-in motion-reduce:animate-none">
                <XCircle className="w-4 h-4 shrink-0" />
                Revise os campos destacados antes de enviar.
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
