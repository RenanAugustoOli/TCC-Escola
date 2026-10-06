import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { WorkoutDifficulty } from '@academia/shared'

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

interface CardExercise {
  id: string
  name: string
  notes?: string
  sets: number
  reps: string
  restSeconds: number
}

interface WorkoutCardProps {
  name: string
  description?: string
  durationMinutes?: number
  difficulty?: WorkoutDifficulty
  trainerName?: string
  exercises: CardExercise[]
  doneToday: boolean
  pending: boolean
  onComplete: () => void
}

export function WorkoutCard({
  name, description, durationMinutes, difficulty, trainerName, exercises, doneToday, pending, onComplete,
}: WorkoutCardProps) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.workoutName}>{name}</Text>
          {description && <Text style={s.workoutDesc}>{description}</Text>}
          {trainerName && <Text style={s.trainer}>por {trainerName}</Text>}
        </View>
        {difficulty && (
          <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLOR[difficulty] }]}>
            <Text style={[s.diffText, { color: DIFFICULTY_TEXT[difficulty] }]}>
              {DIFFICULTY_LABEL[difficulty]}
            </Text>
          </View>
        )}
      </View>

      <View style={s.metaRow}>
        {durationMinutes !== undefined && (
          <View style={s.meta}>
            <Ionicons name="time-outline" size={14} color="#9ca3af" />
            <Text style={s.metaText}>{durationMinutes} min</Text>
          </View>
        )}
        <View style={s.meta}>
          <Ionicons name="list-outline" size={14} color="#9ca3af" />
          <Text style={s.metaText}>{exercises.length} exercícios</Text>
        </View>
      </View>

      <View style={s.exercises}>
        {exercises.map((ex, i) => (
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
        style={[s.completeBtn, doneToday && s.completeBtnDone]}
        onPress={onComplete}
        disabled={doneToday || pending}
      >
        <Ionicons name={doneToday ? 'checkmark-done-circle' : 'checkmark-circle-outline'} size={20} color="#fff" />
        <Text style={s.completeBtnText}>{doneToday ? 'Concluído hoje' : 'Concluir Treino'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  workoutName: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  workoutDesc: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  trainer: { color: '#60a5fa', fontSize: 12, marginTop: 4, fontWeight: '500' },
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
  completeBtnDone: { backgroundColor: '#065f46' },
  completeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
})
