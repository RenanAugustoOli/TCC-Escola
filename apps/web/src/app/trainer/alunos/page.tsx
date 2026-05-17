'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Search, Dumbbell, Plus, Users } from 'lucide-react'
import Link from 'next/link'

export default function TrainerAlunosPage() {
  const [search, setSearch] = useState('')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['trainer-students'],
    queryFn: () =>
      api.get('/users', { params: { perPage: 100 } }).then((r) =>
        r.data.data.filter((u: any) => u.role === 'MEMBER')
      ),
  })

  const filtered = members.filter(
    (u: any) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Meus Alunos</h1>
          <p className="page-subtitle">Gerencie os treinos personalizados de cada aluno</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users size={16} />
          {members.length} alunos
        </div>
      </div>

      <div className="card mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Buscar aluno por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">Nenhum aluno encontrado.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((member: any) => (
            <div key={member.id} className="card hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                  style={{ backgroundColor: '#0047AB' }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{member.name}</p>
                  <p className="text-sm text-gray-400 truncate">{member.email}</p>
                  {member.phone && <p className="text-xs text-gray-400 mt-0.5">{member.phone}</p>}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <Link
                  href={`/trainer/alunos/${member.id}`}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  <Dumbbell size={14} />
                  Ver Treinos
                </Link>
                <Link
                  href={`/trainer/alunos/${member.id}?new=1`}
                  className="btn-secondary text-sm py-2"
                >
                  <Plus size={14} />
                  Novo
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
