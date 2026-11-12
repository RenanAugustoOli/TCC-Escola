import { useQuery } from '@tanstack/react-query'
import type { AgendaItem, PersonalWorkout, Subscription, Workout } from '@academia/shared'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export interface HistoryItem {
  id: string
  kind: 'plan' | 'personal'
  completedAt: string
  workout: { id: string; name: string; durationMinutes: number | null }
}

export interface TodayDone {
  workoutIds: string[]
  personalWorkoutIds: string[]
}

export const usePlanWorkouts = () =>
  useQuery<Workout[]>({ queryKey: ['workouts'], queryFn: () => api.get('/workouts').then((r) => r.data) })

export const usePersonalWorkouts = () =>
  useQuery<PersonalWorkout[]>({
    queryKey: ['personal-workouts-my'],
    queryFn: () => api.get('/personal-workouts/my').then((r) => r.data),
  })

export const useTodayDone = () =>
  useQuery<TodayDone>({ queryKey: ['workouts-today'], queryFn: () => api.get('/workouts/my/today').then((r) => r.data) })

export const useHistory = () =>
  useQuery<HistoryItem[]>({
    queryKey: ['workout-history'],
    queryFn: () => api.get('/workouts/my/history').then((r) => r.data),
  })

export const useAgenda = () =>
  useQuery<AgendaItem[]>({ queryKey: ['agenda'], queryFn: () => api.get('/classes/agenda').then((r) => r.data) })

export function useSubscriptions() {
  const { user } = useAuth()
  return useQuery<Subscription[]>({
    queryKey: ['my-subscriptions', user?.id],
    queryFn: () => api.get(`/users/${user?.id}/subscriptions`).then((r) => r.data),
    enabled: !!user,
  })
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

// Dias seguidos com treino, contando a partir de hoje (ou de ontem, se hoje ainda não treinou)
export function streakDays(history: HistoryItem[]): number {
  const days = new Set(history.map((h) => dayKey(new Date(h.completedAt))))
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// Segunda a domingo da semana atual, marcando os dias em que houve treino
export function currentWeek(history: HistoryItem[]): { label: string; trained: boolean; isToday: boolean; isFuture: boolean }[] {
  const days = new Set(history.map((h) => dayKey(new Date(h.completedAt))))
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  return ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      label,
      trained: days.has(dayKey(d)),
      isToday: dayKey(d) === dayKey(today),
      isFuture: d.getTime() > today.getTime() && dayKey(d) !== dayKey(today),
    }
  })
}

export const daysLeft = (endDate: string) =>
  Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000))

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function relativeDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000)
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dayMonth = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
  if (diff === 0) return `Hoje, ${dayMonth}`
  if (diff === 1) return `Amanhã, ${dayMonth}`
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dayMonth}`
}

export const videoUrlFor = (exercise: { name: string; videoUrl?: string | null }) =>
  exercise.videoUrl ||
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} execução correta`)}`
