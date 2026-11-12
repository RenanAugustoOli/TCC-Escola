import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, errorMessage } from '@/lib/api'
import { usePersonalWorkouts, usePlanWorkouts, useTodayDone, videoUrlFor } from '@/lib/data'
import { Banner, Button, EmptyState, Loading, Pill, ScreenHeader } from '@/components/ui'
import { colors, DIFFICULTY_LABEL, radius, shadow } from '@/theme'

interface DetailExercise {
  id: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string | null
  videoUrl?: string | null
}

export default function TreinoScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { id, kind } = useLocalSearchParams<{ id: string; kind: 'plan' | 'personal' }>()
  const isPersonal = kind === 'personal'

  const { data: planWorkouts = [], isLoading: loadingPlan } = usePlanWorkouts()
  const { data: personalWorkouts = [], isLoading: loadingPersonal } = usePersonalWorkouts()
  const { data: today } = useTodayDone()

  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [justFinished, setJustFinished] = useState(false)

  const plan = isPersonal ? undefined : planWorkouts.find((w) => w.id === id)
  const personal = isPersonal ? personalWorkouts.find((w) => w.id === id) : undefined
  const workout = plan ?? personal
  const exercises: DetailExercise[] = workout?.exercises ?? []

  const doneToday = isPersonal
    ? (today?.personalWorkoutIds.includes(id) ?? false)
    : (today?.workoutIds.includes(id) ?? false)

  const complete = useMutation({
    mutationFn: () => api.post(isPersonal ? `/personal-workouts/${id}/complete` : `/workouts/${id}/complete`),
    onSuccess: () => setJustFinished(true),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts-today'] })
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
    },
  })

  if (loadingPlan || loadingPersonal) return <Loading />

  if (!workout) {
    return (
      <View style={s.container}>
        <ScreenHeader title="Treino" back />
        <EmptyState icon="barbell-outline" title="Treino não encontrado" text="Ele pode ter sido removido ou não fazer mais parte do seu plano." />
      </View>
    )
  }

  const toggle = (exerciseId: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseId)) next.delete(exerciseId)
      else next.add(exerciseId)
      return next
    })

  const progress = exercises.length ? checked.size / exercises.length : 0
  const meta = [
    plan ? `${plan.durationMinutes} min` : null,
    `${exercises.length} exercícios`,
    personal?.trainer?.name ? `por ${personal.trainer.name}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <View style={s.container}>
      <ScreenHeader title={workout.name} subtitle={meta} back />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.pills}>
          {plan && <Pill label={DIFFICULTY_LABEL[plan.difficulty]} tone="accent" />}
          {isPersonal && <Pill label="Personalizado" tone="accent" />}
          {doneToday && <Pill label="Feito hoje" tone="success" />}
        </View>
        {workout.description ? <Text style={s.description}>{workout.description}</Text> : null}

        <View style={s.progressRow}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={s.progressText}>{checked.size}/{exercises.length}</Text>
        </View>

        {exercises.map((ex, i) => {
          const done = checked.has(ex.id)
          return (
            <View key={ex.id} style={[s.exercise, done && { opacity: 0.6 }]}>
              <Pressable style={s.exerciseMain} onPress={() => toggle(ex.id)} accessibilityRole="checkbox" accessibilityState={{ checked: done }}>
                <View style={[s.check, done && s.checkDone]}>
                  {done ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={s.checkNum}>{i + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.exerciseName, done && { textDecorationLine: 'line-through' }]}>{ex.name}</Text>
                  <Text style={s.exerciseMeta}>
                    {ex.sets} séries × {ex.reps} · {ex.restSeconds}s de descanso
                  </Text>
                  {ex.notes ? <Text style={s.exerciseNotes}>{ex.notes}</Text> : null}
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.videoBtn, pressed && { opacity: 0.7 }]}
                onPress={() => Linking.openURL(videoUrlFor(ex))}
                accessibilityLabel={`Ver vídeo de ${ex.name}`}
              >
                <Ionicons name="play-circle" size={18} color={colors.accentDark} />
                <Text style={s.videoText}>{ex.videoUrl ? 'Ver vídeo' : 'Buscar vídeo'}</Text>
              </Pressable>
            </View>
          )
        })}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {complete.isError && <Banner message={errorMessage(complete.error, 'Não foi possível registrar o treino.')} />}
        {justFinished && <Banner tone="success" message="Treino registrado. Mandou bem!" />}
        {doneToday || justFinished ? (
          <Button label="Voltar aos treinos" variant="secondary" onPress={() => router.replace('/(tabs)/treinos')} />
        ) : (
          <Button label="Concluir treino" icon="checkmark-circle" onPress={() => complete.mutate()} loading={complete.isPending} />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24, maxWidth: 560, width: '100%', alignSelf: 'center' },
  pills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  description: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 16 },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '700', color: colors.muted, minWidth: 34, textAlign: 'right' },
  exercise: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginBottom: 10, ...shadow },
  exerciseMain: { flexDirection: 'row', gap: 14 },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkNum: { fontSize: 13, fontWeight: '700', color: colors.muted },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  exerciseMeta: { fontSize: 13, color: colors.muted, marginTop: 3 },
  exerciseNotes: { fontSize: 13, color: colors.warn, marginTop: 6, lineHeight: 18 },
  videoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12, marginLeft: 44, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 12, height: 34 },
  videoText: { fontSize: 13, fontWeight: '700', color: colors.accentDark },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line, maxWidth: 560, width: '100%', alignSelf: 'center' },
})
