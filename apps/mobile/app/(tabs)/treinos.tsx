import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { WorkoutCard } from '@/components/WorkoutCard'
import { Workout, PersonalWorkout } from '@academia/shared'
import { Ionicons } from '@expo/vector-icons'

interface TodayDone {
  workoutIds: string[]
  personalWorkoutIds: string[]
}

type CompleteTarget = { kind: 'plan' | 'personal'; id: string }

function errorMessage(err: unknown): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof message === 'string' ? message : 'Não foi possível registrar o treino. Tente novamente.'
}

export default function TreinosScreen() {
  const queryClient = useQueryClient()

  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => api.get('/workouts').then((r) => r.data),
  })

  const { data: personalWorkouts = [] } = useQuery<PersonalWorkout[]>({
    queryKey: ['personal-workouts-my'],
    queryFn: () => api.get('/personal-workouts/my').then((r) => r.data),
  })

  const { data: today } = useQuery<TodayDone>({
    queryKey: ['workouts-today'],
    queryFn: () => api.get('/workouts/my/today').then((r) => r.data),
  })

  const complete = useMutation({
    mutationFn: (target: CompleteTarget) =>
      api.post(target.kind === 'plan' ? `/workouts/${target.id}/complete` : `/personal-workouts/${target.id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts-today'] })
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
      Alert.alert('Parabéns!', 'Treino concluído e registrado!')
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['workouts-today'] })
      Alert.alert('Não foi possível concluir', errorMessage(err))
    },
  })

  if (isLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#9ca3af' }}>Carregando treinos...</Text>
      </View>
    )
  }

  if (workouts.length === 0 && personalWorkouts.length === 0) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Ionicons name="barbell-outline" size={60} color="#4b5563" />
        <Text style={{ color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
          Nenhum treino disponível para o seu plano atual.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Meus Treinos</Text>

      {personalWorkouts.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Com meu personal</Text>
          {personalWorkouts.map((pw) => (
            <WorkoutCard
              key={pw.id}
              name={pw.name}
              description={pw.description}
              trainerName={pw.trainer?.name}
              exercises={pw.exercises}
              doneToday={today?.personalWorkoutIds.includes(pw.id) ?? false}
              pending={complete.isPending}
              onComplete={() => complete.mutate({ kind: 'personal', id: pw.id })}
            />
          ))}
        </>
      )}

      {workouts.length > 0 && (
        <>
          {personalWorkouts.length > 0 && <Text style={s.sectionTitle}>Do meu plano</Text>}
          {workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              name={w.name}
              description={w.description}
              durationMinutes={w.durationMinutes}
              difficulty={w.difficulty}
              exercises={w.exercises}
              doneToday={today?.workoutIds.includes(w.id) ?? false}
              pending={complete.isPending}
              onComplete={() => complete.mutate({ kind: 'plan', id: w.id })}
            />
          ))}
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 4 },
})
