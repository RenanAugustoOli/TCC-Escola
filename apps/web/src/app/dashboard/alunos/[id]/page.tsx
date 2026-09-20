'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PhysicalAssessment, User } from '@academia/shared'
import { Plus, Ruler } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Admin', PERSONAL_TRAINER: 'Personal', MEMBER: 'Aluno', RECEPTIONIST: 'Recepção' }

interface AssessmentFormState {
  weightKg: string
  heightCm: string
  bodyFatPercent: string
  waistCm: string
  hipCm: string
  chestCm: string
  armCm: string
  thighCm: string
}

const EMPTY_FORM: AssessmentFormState = {
  weightKg: '', heightCm: '', bodyFatPercent: '', waistCm: '', hipCm: '', chestCm: '', armCm: '', thighCm: '',
}

export default function AlunoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AssessmentFormState>(EMPTY_FORM)

  const { data: user, isLoading: loadingUser } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
  })

  const { data: subscriptions } = useQuery({
    queryKey: ['user-subscriptions', id],
    queryFn: () => api.get(`/users/${id}/subscriptions`).then((r) => r.data),
  })

  const { data: assessments, isLoading: loadingAssessments } = useQuery<PhysicalAssessment[]>({
    queryKey: ['user-assessments', id],
    queryFn: () => api.get(`/users/${id}/assessments`).then((r) => r.data),
  })

  const createAssessment = useMutation({
    mutationFn: (payload: Record<string, number>) => api.post(`/users/${id}/assessments`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assessments', id] })
      setForm(EMPTY_FORM)
      setShowForm(false)
    },
  })

  const activeSubscription = (subscriptions ?? []).find((s: any) => s.status === 'ACTIVE')

  const chartData = (assessments ?? []).map((a) => ({
    date: new Date(a.assessedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    peso: a.weightKg,
    gordura: a.bodyFatPercent,
  }))

  const submitAssessment = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, number> = {
      weightKg: Number(form.weightKg),
      heightCm: Number(form.heightCm),
    }
    if (form.bodyFatPercent) payload.bodyFatPercent = Number(form.bodyFatPercent)
    if (form.waistCm) payload.waistCm = Number(form.waistCm)
    if (form.hipCm) payload.hipCm = Number(form.hipCm)
    if (form.chestCm) payload.chestCm = Number(form.chestCm)
    if (form.armCm) payload.armCm = Number(form.armCm)
    if (form.thighCm) payload.thighCm = Number(form.thighCm)
    createAssessment.mutate(payload)
  }

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center p-16 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
        Carregando...
      </div>
    )
  }

  if (!user) {
    return <div className="p-16 text-center text-gray-400 text-sm">Aluno não encontrado.</div>
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white flex-shrink-0"
          style={{ backgroundColor: '#0047AB' }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="page-title">{user.name}</h1>
          <p className="page-subtitle">{user.email} · {ROLE_LABEL[user.role] ?? user.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500 font-medium mb-1">Telefone</p>
          <p className="font-semibold text-gray-900">{user.phone ?? '—'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 font-medium mb-1">Plano atual</p>
          <p className="font-semibold text-gray-900">{activeSubscription?.plan?.name ?? 'Sem assinatura ativa'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 font-medium mb-1">Cliente desde</p>
          <p className="font-semibold text-gray-900">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div className="card mb-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-900">Evolução física</h2>
            <p className="text-xs text-gray-400 mt-0.5">Peso e %gordura ao longo do tempo</p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-xs py-2 px-4">
            <Plus size={14} />
            Nova avaliação
          </button>
        </div>

        {showForm && (
          <form onSubmit={submitAssessment} className="grid grid-cols-4 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
            <input required type="number" step="0.1" placeholder="Peso (kg)" className="input" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
            <input required type="number" step="0.1" placeholder="Altura (cm)" className="input" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
            <input type="number" step="0.1" placeholder="% Gordura" className="input" value={form.bodyFatPercent} onChange={(e) => setForm({ ...form, bodyFatPercent: e.target.value })} />
            <input type="number" step="0.1" placeholder="Cintura (cm)" className="input" value={form.waistCm} onChange={(e) => setForm({ ...form, waistCm: e.target.value })} />
            <input type="number" step="0.1" placeholder="Quadril (cm)" className="input" value={form.hipCm} onChange={(e) => setForm({ ...form, hipCm: e.target.value })} />
            <input type="number" step="0.1" placeholder="Peito (cm)" className="input" value={form.chestCm} onChange={(e) => setForm({ ...form, chestCm: e.target.value })} />
            <input type="number" step="0.1" placeholder="Braço (cm)" className="input" value={form.armCm} onChange={(e) => setForm({ ...form, armCm: e.target.value })} />
            <input type="number" step="0.1" placeholder="Coxa (cm)" className="input" value={form.thighCm} onChange={(e) => setForm({ ...form, thighCm: e.target.value })} />
            <button type="submit" disabled={createAssessment.isPending} className="btn-primary text-xs col-span-4 justify-self-start">
              {createAssessment.isPending ? 'Salvando...' : 'Salvar avaliação'}
            </button>
          </form>
        )}

        {loadingAssessments ? (
          <div className="flex items-center justify-center p-10 text-gray-400 text-sm">Carregando...</div>
        ) : (assessments ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-gray-400 text-sm gap-2">
            <Ruler size={24} className="text-gray-300" />
            Nenhuma avaliação registrada ainda.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Line type="monotone" dataKey="peso" stroke="#0047AB" strokeWidth={2.5} dot={{ r: 3 }} name="Peso (kg)" />
                <Line type="monotone" dataKey="gordura" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="% Gordura" />
              </LineChart>
            </ResponsiveContainer>

            <table className="w-full text-sm mt-6">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="table-header">Data</th>
                  <th className="table-header">Peso</th>
                  <th className="table-header">% Gordura</th>
                  <th className="table-header">Cintura</th>
                  <th className="table-header">Quadril</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...(assessments ?? [])].reverse().map((a) => (
                  <tr key={a.id} className="table-row">
                    <td className="px-6 py-3 text-gray-500 text-xs">{new Date(a.assessedAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">{a.weightKg} kg</td>
                    <td className="px-6 py-3 text-gray-600">{a.bodyFatPercent ? `${a.bodyFatPercent}%` : '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{a.waistCm ? `${a.waistCm} cm` : '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{a.hipCm ? `${a.hipCm} cm` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
