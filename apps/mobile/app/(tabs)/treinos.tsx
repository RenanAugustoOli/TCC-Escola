import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePersonalWorkouts, usePlanWorkouts, useTodayDone } from '@/lib/data'
import { Card, EmptyState, Loading, Pill, ScreenHeader } from '@/components/ui'
import { colors, DIFFICULTY_LABEL } from '@/theme'

function WorkoutRow({ name, meta, pill, done, onPress }: { name: string; meta: string; pill?: string; done: boolean; onPress: () => void }) {
  return (
    <Card style={{ marginBottom: 12 }} onPress={onPress}>
      <View style={s.row}>
        <View style={[s.icon, done && { backgroundColor: colors.successSoft }]}>
          <Ionicons name={done ? 'checkmark' : 'barbell'} size={22} color={done ? colors.success : colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.meta}>{meta}</Text>
          <View style={s.pills}>
            {done && <Pill label="Feito hoje" tone="success" />}
            {pill && <Pill label={pill} />}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </View>
    </Card>
  )
}

export default function TreinosScreen() {
  const { data: workouts = [], isLoading } = usePlanWorkouts()
  const { data: personalWorkouts = [], isLoading: loadingPersonal } = usePersonalWorkouts()
  const { data: today } = useTodayDone()

  if (isLoading || loadingPersonal) return <Loading />

  const empty = workouts.length === 0 && personalWorkouts.length === 0

  return (
    <View style={s.container}>
      <ScreenHeader title="Treinos" subtitle="Toque em um treino para ver os exercícios e os vídeos" />
      <ScrollView contentContainerStyle={s.content}>
        {empty && (
          <EmptyState
            icon="barbell-outline"
            title="Nenhum treino liberado"
            text="Os treinos aparecem aqui quando seu plano está ativo ou quando um personal monta um treino para você."
          />
        )}

        {personalWorkouts.length > 0 && (
          <>
            <Text style={s.section}>Montado pelo seu personal</Text>
            {personalWorkouts.map((pw) => (
              <WorkoutRow
                key={pw.id}
                name={pw.name}
                meta={[`${pw.exercises.length} exercícios`, pw.trainer?.name ? `por ${pw.trainer.name}` : null].filter(Boolean).join(' · ')}
                done={today?.personalWorkoutIds.includes(pw.id) ?? false}
                onPress={() => router.push({ pathname: '/treino/[id]', params: { id: pw.id, kind: 'personal' } })}
              />
            ))}
          </>
        )}

        {workouts.length > 0 && (
          <>
            <Text style={s.section}>Do seu plano</Text>
            {workouts.map((w) => (
              <WorkoutRow
                key={w.id}
                name={w.name}
                meta={`${w.durationMinutes} min · ${w.exercises.length} exercícios`}
                pill={DIFFICULTY_LABEL[w.difficulty]}
                done={today?.workoutIds.includes(w.id) ?? false}
                onPress={() => router.push({ pathname: '/treino/[id]', params: { id: w.id, kind: 'plan' } })}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center' },
  section: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, lineHeight: 21 },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  pills: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
})
