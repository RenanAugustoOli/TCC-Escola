import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Workout } from '@academia/shared'
import { Ionicons } from '@expo/vector-icons'

const DIFFICULTY_COLOR = {
  BEGINNER: '#065f46',
  INTERMEDIATE: '#78350f',
  ADVANCED: '#7f1d1d',
}
const DIFFICULTY_TEXT = {
  BEGINNER: '#34d399',
  INTERMEDIATE: '#fbbf24',
  ADVANCED: '#f87171',
}
const DIFFICULTY_LABEL = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
}

export default function TreinosScreen() {
  const queryClient = useQueryClient()

  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => api.get('/workouts').then((r) => r.data),
  })

  const complete = useMutation({
    mutationFn: (workoutId: string) => api.post(`/workouts/${workoutId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
      Alert.alert('Parabéns!', 'Treino concluído e registrado!')
    },
  })

  if (isLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#9ca3af' }}>Carregando treinos...</Text>
      </View>
    )
  }

  if (workouts.length === 0) {
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

      {workouts.map((w) => (
        <View key={w.id} style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.workoutName}>{w.name}</Text>
              {w.description && <Text style={s.workoutDesc}>{w.description}</Text>}
            </View>
            <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLOR[w.difficulty] }]}>
              <Text style={[s.diffText, { color: DIFFICULTY_TEXT[w.difficulty] }]}>
                {DIFFICULTY_LABEL[w.difficulty]}
              </Text>
            </View>
          </View>

          <View style={s.metaRow}>
            <View style={s.meta}>
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text style={s.metaText}>{w.durationMinutes} min</Text>
            </View>
            <View style={s.meta}>
              <Ionicons name="list-outline" size={14} color="#9ca3af" />
              <Text style={s.metaText}>{w.exercises.length} exercícios</Text>
            </View>
          </View>

          <View style={s.exercises}>
            {w.exercises.map((ex, i) => (
              <View key={ex.id} style={s.exerciseRow}>
                <Text style={s.exerciseNum}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.exerciseName}>{ex.name}</Text>
                  {ex.notes && <Text style={s.exerciseNote}>{ex.notes}</Text>}
                </View>
                <Text style={s.exerciseSets}>{ex.sets}×{ex.reps}</Text>
                <Text style={s.exerciseRest}>{ex.restSeconds}s</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.completeBtn}
            onPress={() => complete.mutate(w.id)}
            disabled={complete.isPending}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={s.completeBtnText}>Concluir Treino</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  workoutName: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  workoutDesc: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  diffText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#9ca3af', fontSize: 13 },
  exercises: { gap: 8, marginBottom: 16 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0f172a', borderRadius: 10, padding: 12 },
  exerciseNum: { color: '#6b7280', width: 20, textAlign: 'center', fontSize: 13 },
  exerciseName: { color: '#e5e7eb', fontSize: 14, fontWeight: '500' },
  exerciseNote: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  exerciseSets: { color: '#2563eb', fontWeight: 'bold', fontSize: 13, minWidth: 40, textAlign: 'right' },
  exerciseRest: { color: '#6b7280', fontSize: 12, minWidth: 32, textAlign: 'right' },
  completeBtn: {
    backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  completeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
})
