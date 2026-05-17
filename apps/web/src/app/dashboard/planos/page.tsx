'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plan } from '@academia/shared'
import { Plus, Check, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function PlanosPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', durationDays: '30', features: '' })

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans-all'],
    queryFn: () => api.get('/plans/all').then((r) => r.data),
  })

  const createPlan = useMutation({
    mutationFn: (data: object) => api.post('/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans-all'] })
      setShowForm(false)
      setForm({ name: '', description: '', price: '', durationDays: '30', features: '' })
    },
  })

  const deletePlan = useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans-all'] }),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createPlan.mutate({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      features: form.features.split('\n').filter(Boolean),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Planos</h1>
          <p className="page-subtitle">Gerencie os planos disponíveis para os alunos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={16} />
          Novo Plano
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-bold text-gray-900 mb-5">Criar Novo Plano</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Plano Premium" />
            </div>
            <div>
              <label className="label">Preço (R$)</label>
              <input type="number" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="149.90" />
            </div>
            <div>
              <label className="label">Descrição</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição curta do plano" />
            </div>
            <div>
              <label className="label">Duração (dias)</label>
              <input type="number" className="input" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <label className="label">Benefícios (um por linha)</label>
              <textarea
                rows={4}
                className="input resize-none"
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder="Acesso total&#10;Personal trainer&#10;Avaliação física"
              />
            </div>
            <div className="col-span-2 flex gap-3 pt-2 border-t border-gray-100">
              <button type="submit" className="btn-primary" disabled={createPlan.isPending}>
                {createPlan.isPending ? 'Salvando...' : 'Criar Plano'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className="card relative flex flex-col">
              {!plan.isActive && (
                <span className="absolute top-4 right-4 badge-inactive">Inativo</span>
              )}

              <div className="mb-2">
                <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                {plan.description && <p className="text-sm text-gray-400 mt-1">{plan.description}</p>}
              </div>

              <div className="mb-4 flex items-end gap-1">
                <span className="text-3xl font-black" style={{ color: '#0047AB' }}>
                  {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-gray-400 text-sm mb-0.5">/{plan.durationDays}d</span>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => deletePlan.mutate(plan.id)}
                  className="text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 font-medium transition-colors"
                >
                  <Trash2 size={12} />
                  Desativar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
