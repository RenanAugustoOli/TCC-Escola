'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { User } from '@academia/shared'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  PERSONAL_TRAINER: 'Personal',
  MEMBER: 'Aluno',
}
const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'badge-active',
  PERSONAL_TRAINER: 'badge-trainer',
  MEMBER: 'badge-inactive',
}

export default function AlunosPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () =>
      api.get('/users', { params: { page, perPage: 20, search: search || undefined } }).then((r) => r.data),
  })

  const users: User[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Alunos</h1>
          <p className="page-subtitle">{data?.total ?? 0} usuários cadastrados</p>
        </div>
        <Link href="/dashboard/alunos/novo" className="btn-primary text-sm">
          <Plus size={16} />
          Novo Aluno
        </Link>
      </div>

      <div className="card mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-16 text-gray-400 text-sm">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
            Carregando...
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-sm">Nenhum usuário encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Usuário</th>
                <th className="table-header">Telefone</th>
                <th className="table-header">Função</th>
                <th className="table-header">Cadastro</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                        style={{ backgroundColor: '#0047AB' }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.phone ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role] ?? u.role}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/alunos/${u.id}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Ver detalhes →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              ← Anterior
            </button>
            <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
