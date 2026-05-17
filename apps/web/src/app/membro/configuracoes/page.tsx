'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { CheckCircle, Save } from 'lucide-react'

export default function ConfiguracoesMembroPage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [password, setPassword] = useState('')
  const [saved, setSaved] = useState(false)

  const update = useMutation({
    mutationFn: (data: object) => api.put(`/users/${user?.id}`, data),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: Record<string, string> = { name, phone }
    if (password) data.password = password
    update.mutate(data)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Atualize seus dados pessoais</p>
      </div>

      <div className="max-w-xl">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-5">Dados pessoais</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-gray-50" value={user?.email ?? ''} disabled />
              <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="label">Nova senha <span className="text-gray-400 font-normal">(deixe em branco para não alterar)</span></label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={update.isPending}>
                <Save size={16} />
                {update.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
              {saved && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} /> Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
