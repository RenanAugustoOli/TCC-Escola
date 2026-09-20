'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DashboardStats } from '@academia/shared'
import { StatCard } from '@/components/StatCard'
import { Users, TrendingUp, AlertCircle, DollarSign, Repeat, ShieldCheck } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const PIE_COLORS = ['#0047AB', '#10b981', '#8b5cf6', '#f59e0b']

export default function DashboardPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  })

  const { data: revenue } = useQuery<{ month: string; revenue: number }[]>({
    queryKey: ['dashboard-revenue'],
    queryFn: () => api.get('/dashboard/revenue').then((r) => r.data),
  })

  const { data: byPlan } = useQuery<{ plan: string; count: number }[]>({
    queryKey: ['dashboard-by-plan'],
    queryFn: () => api.get('/dashboard/subscriptions-by-plan').then((r) => r.data),
  })

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral da academia em tempo real</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Total de Alunos"
          value={stats?.totalMembers ?? '—'}
          subtitle={`+${stats?.newMembersThisMonth ?? 0} este mês`}
          icon={<Users size={18} />}
          color="blue"
        />
        <StatCard
          title="Assinaturas Ativas"
          value={stats?.activeSubscriptions ?? '—'}
          icon={<TrendingUp size={18} />}
          color="green"
        />
        <StatCard
          title="Receita Mensal"
          value={stats ? fmt(stats.monthlyRevenue) : '—'}
          icon={<DollarSign size={18} />}
          color="orange"
        />
        <StatCard
          title="Inadimplentes"
          value={stats?.overduePayments ?? '—'}
          icon={<AlertCircle size={18} />}
          color="red"
        />
        <StatCard
          title="MRR"
          value={stats ? fmt(stats.mrr) : '—'}
          subtitle="Receita recorrente mensal"
          icon={<Repeat size={18} />}
          color="blue"
        />
        <StatCard
          title="Taxa de Retenção"
          value={stats ? `${stats.retentionRate.toFixed(1)}%` : '—'}
          subtitle={`Churn de ${stats?.churnRate.toFixed(1) ?? 0}% este mês`}
          icon={<ShieldCheck size={18} />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-900">Receita mensal</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue ?? []} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0047AB" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#0047AB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                formatter={(v: number) => [fmt(v), 'Receita']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0047AB" fill="url(#revGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="font-bold text-gray-900">Assinaturas por Plano</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribuição atual</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byPlan ?? []}
                dataKey="count"
                nameKey="plan"
                cx="50%"
                cy="45%"
                outerRadius={72}
                strokeWidth={2}
                stroke="#fff"
              >
                {(byPlan ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
