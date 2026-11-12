import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  currentWeek, daysLeft, formatTime, relativeDay, streakDays,
  useAgenda, useHistory, usePersonalWorkouts, usePlanWorkouts, useSubscriptions, useTodayDone,
} from '@/lib/data'
import { Card, Pill } from '@/components/ui'
import { colors, radius } from '@/theme'

interface Suggestion {
  id: string
  kind: 'plan' | 'personal'
  name: string
  exercises: number
  durationMinutes?: number
  trainer?: string
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const { data: planWorkouts = [], isLoading: loadingPlan } = usePlanWorkouts()
  const { data: personalWorkouts = [] } = usePersonalWorkouts()
  const { data: today, isLoading: loadingToday } = useTodayDone()
  const { data: history = [], isLoading: loadingHistory } = useHistory()
  const { data: agenda = [] } = useAgenda()
  const { data: subscriptions = [], isLoading: loadingSubs } = useSubscriptions()

  const onRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setRefreshing(false)
  }

  const doneToday = (today?.workoutIds.length ?? 0) + (today?.personalWorkoutIds.length ?? 0) > 0
  const week = currentWeek(history)
  const trainedThisWeek = week.filter((d) => d.trained).length
  const streak = streakDays(history)

  // Sugere o treino que está há mais tempo sem ser feito (os nunca feitos vêm primeiro)
  const lastDone = new Map<string, number>()
  for (const h of history) {
    const key = `${h.kind}:${h.workout.id}`
    if (!lastDone.has(key)) lastDone.set(key, new Date(h.completedAt).getTime())
  }
  const candidates: Suggestion[] = [
    ...personalWorkouts.map((w) => ({ id: w.id, kind: 'personal' as const, name: w.name, exercises: w.exercises.length, trainer: w.trainer?.name })),
    ...planWorkouts.map((w) => ({ id: w.id, kind: 'plan' as const, name: w.name, exercises: w.exercises.length, durationMinutes: w.durationMinutes })),
  ]
  const suggestion = [...candidates].sort(
    (a, b) => (lastDone.get(`${a.kind}:${a.id}`) ?? 0) - (lastDone.get(`${b.kind}:${b.id}`) ?? 0)
  )[0]

  const activeSub = subscriptions.find((sub) => sub.status === 'ACTIVE')
  const latestSub = subscriptions[0]
  const remaining = activeSub ? daysLeft(activeSub.endDate) : 0
  const nextClass = agenda.find((a) => a.bookedByMe && new Date(a.startsAt) > new Date())

  const firstName = user?.name?.split(' ')[0] ?? ''
  const rawDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)
  const heroLoading = loadingPlan || loadingSubs || loadingToday

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.date}>{dateLabel}</Text>
          <Text style={s.greeting}>Olá, {firstName}</Text>
        </View>
        <Pressable style={s.avatar} onPress={() => router.push('/(tabs)/perfil')} accessibilityLabel="Abrir perfil">
          <Text style={s.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* Treino de hoje */}
      <View style={s.hero}>
        <Text style={s.heroLabel}>{doneToday ? 'TREINO DE HOJE CONCLUÍDO' : 'TREINO DE HOJE'}</Text>
        {heroLoading ? (
          <Text style={s.heroTitle}>Carregando…</Text>
        ) : suggestion ? (
          <>
            <Text style={s.heroTitle}>{doneToday ? 'Boa! Missão cumprida.' : suggestion.name}</Text>
            <Text style={s.heroMeta}>
              {doneToday
                ? 'Descanse, hidrate-se e volte amanhã.'
                : [
                    suggestion.durationMinutes ? `${suggestion.durationMinutes} min` : null,
                    `${suggestion.exercises} exercícios`,
                    suggestion.trainer ? `por ${suggestion.trainer}` : null,
                  ].filter(Boolean).join(' · ')}
            </Text>
            <Pressable
              style={({ pressed }) => [s.heroBtn, pressed && { opacity: 0.85 }]}
              onPress={() =>
                doneToday
                  ? router.push('/(tabs)/treinos')
                  : router.push({ pathname: '/treino/[id]', params: { id: suggestion.id, kind: suggestion.kind } })
              }
            >
              <Ionicons name={doneToday ? 'list' : 'play'} size={16} color={colors.ink} />
              <Text style={s.heroBtnText}>{doneToday ? 'Ver meus treinos' : 'Começar treino'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={s.heroTitle}>Nenhum treino liberado</Text>
            <Text style={s.heroMeta}>Seu plano precisa estar ativo para liberar os treinos.</Text>
            <Pressable style={s.heroBtn} onPress={() => router.push('/assinatura')}>
              <Text style={s.heroBtnText}>Ver minha assinatura</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Semana */}
      <Card style={{ marginBottom: 14 }}>
        <View style={s.rowBetween}>
          <Text style={s.cardTitle}>Sua semana</Text>
          {streak > 1 && <Pill label={`${streak} dias seguidos`} tone="accent" />}
        </View>
        <View style={s.weekRow}>
          {week.map((day, i) => (
            <View key={i} style={s.weekDay}>
              <View style={[s.weekDot, day.trained && s.weekDotDone, day.isToday && !day.trained && s.weekDotToday]}>
                {day.trained && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={[s.weekLabel, day.isToday && { color: colors.ink, fontWeight: '800' }]}>{day.label}</Text>
            </View>
          ))}
        </View>
        <Text style={s.cardHint}>
          {loadingHistory
            ? 'Carregando sua semana…'
            : trainedThisWeek === 0
            ? 'Nenhum treino nesta semana ainda. Bora começar?'
            : `${trainedThisWeek} ${trainedThisWeek === 1 ? 'dia de treino' : 'dias de treino'} nesta semana`}
        </Text>
      </Card>

      {/* Próxima aula */}
      <Card style={{ marginBottom: 14 }} onPress={() => router.push('/(tabs)/aulas')}>
        <View style={s.linkRow}>
          <View style={[s.iconBox, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="calendar" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.linkTitle}>{nextClass ? nextClass.name : 'Aulas em grupo'}</Text>
            <Text style={s.linkText}>
              {nextClass
                ? `${relativeDay(nextClass.date)} às ${formatTime(nextClass.startsAt)} · reservada`
                : 'Reserve sua vaga em spinning, funcional, yoga e mais'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.faint} />
        </View>
      </Card>

      {/* Nutri */}
      <Card style={{ marginBottom: 14 }} onPress={() => router.push('/(tabs)/nutri')}>
        <View style={s.linkRow}>
          <View style={[s.iconBox, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="nutrition" size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.linkTitle}>Nutri, sua nutricionista de IA</Text>
            <Text style={s.linkText}>Tire dúvidas e peça ideias de refeições para o seu objetivo</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.faint} />
        </View>
      </Card>

      {/* Plano */}
      {!loadingSubs && (
        <Card onPress={() => router.push('/assinatura')}>
          <View style={s.linkRow}>
            <View style={[s.iconBox, { backgroundColor: colors.bg }]}>
              <Ionicons name="card" size={20} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.linkTitle}>{activeSub?.plan ? `Plano ${activeSub.plan.name}` : 'Sem plano ativo'}</Text>
              <Text style={s.linkText}>
                {activeSub
                  ? `Válido por mais ${remaining} ${remaining === 1 ? 'dia' : 'dias'}`
                  : latestSub?.status === 'OVERDUE'
                    ? 'Mensalidade em atraso. Regularize na recepção.'
                    : latestSub?.status === 'FROZEN'
                      ? 'Seu plano está trancado.'
                      : 'Conheça os planos da academia'}
              </Text>
            </View>
            {activeSub && remaining <= 7 ? <Pill label="Vence logo" tone="warn" /> : <Ionicons name="chevron-forward" size={18} color={colors.faint} />}
          </View>
        </Card>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  date: { color: colors.muted, fontSize: 13 },
  greeting: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.6, marginTop: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  hero: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: 22, marginBottom: 14 },
  heroLabel: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginTop: 8, lineHeight: 29 },
  heroMeta: { color: '#B9B9C0', fontSize: 14, marginTop: 6, lineHeight: 20 },
  heroBtn: { marginTop: 18, alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: radius.pill, paddingHorizontal: 18, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroBtnText: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  cardHint: { color: colors.muted, fontSize: 13, marginTop: 14 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  weekDotDone: { backgroundColor: colors.accent },
  weekDotToday: { borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.surface },
  weekLabel: { fontSize: 12, color: colors.faint, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  linkText: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
})
