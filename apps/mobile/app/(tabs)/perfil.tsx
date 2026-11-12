import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { PhysicalAssessment } from '@academia/shared'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { confirmAction } from '@/lib/dialog'
import { daysLeft, streakDays, useHistory, useSubscriptions } from '@/lib/data'
import { Card, Pill, ScreenHeader } from '@/components/ui'
import { colors, radius } from '@/theme'

const STATUS_LABEL: Record<string, { label: string; tone: 'success' | 'warn' | 'danger' | 'neutral' }> = {
  ACTIVE: { label: 'Ativa', tone: 'success' },
  OVERDUE: { label: 'Em atraso', tone: 'danger' },
  FROZEN: { label: 'Trancada', tone: 'warn' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' },
  INACTIVE: { label: 'Inativa', tone: 'neutral' },
}

export default function PerfilScreen() {
  const { user, logout } = useAuth()
  const { data: history = [] } = useHistory()
  const { data: subscriptions = [] } = useSubscriptions()

  const { data: assessments = [] } = useQuery<PhysicalAssessment[]>({
    queryKey: ['my-assessments', user?.id],
    queryFn: () => api.get(`/users/${user?.id}/assessments`).then((r) => r.data),
    enabled: !!user,
  })

  const now = new Date()
  const thisMonth = history.filter((h) => {
    const d = new Date(h.completedAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const last30Days = history.filter((h) => now.getTime() - new Date(h.completedAt).getTime() <= 30 * 86_400_000).length

  const sub = subscriptions.find((x) => x.status === 'ACTIVE') ?? subscriptions[0]
  const status = sub ? STATUS_LABEL[sub.status] : null
  const assessment = assessments[0]
  const bmi = assessment ? assessment.weightKg / (assessment.heightCm / 100) ** 2 : null

  const handleLogout = () =>
    confirmAction('Sair', 'Deseja realmente sair da sua conta?', 'Sair', async () => {
      await logout()
      router.replace('/login')
    })

  return (
    <View style={s.container}>
      <ScreenHeader title="Perfil" />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.identity}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{user?.name}</Text>
            <Text style={s.email}>{user?.email}</Text>
            {user?.phone ? <Text style={s.email}>{user.phone}</Text> : null}
          </View>
        </View>

        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statValue}>{thisMonth}</Text>
            <Text style={s.statLabel}>treinos no mês</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{streakDays(history)}</Text>
            <Text style={s.statLabel}>dias seguidos</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{last30Days}</Text>
            <Text style={s.statLabel}>nos últimos 30 dias</Text>
          </View>
        </View>

        <Text style={s.section}>Assinatura</Text>
        <Card onPress={() => router.push('/assinatura')}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{sub?.plan ? `Plano ${sub.plan.name}` : 'Sem plano'}</Text>
              <Text style={s.cardText}>
                {sub
                  ? sub.status === 'ACTIVE'
                    ? `Vence em ${new Date(sub.endDate).toLocaleDateString('pt-BR')} · ${daysLeft(sub.endDate)} dias`
                    : `Venceu em ${new Date(sub.endDate).toLocaleDateString('pt-BR')}`
                  : 'Conheça os planos da academia'}
              </Text>
            </View>
            {status ? <Pill label={status.label} tone={status.tone} /> : <Ionicons name="chevron-forward" size={18} color={colors.faint} />}
          </View>
        </Card>

        <Text style={s.section}>Avaliação física</Text>
        <Card>
          {assessment ? (
            <>
              <Text style={s.cardText}>Realizada em {new Date(assessment.assessedAt).toLocaleDateString('pt-BR')}</Text>
              <View style={s.measures}>
                <Measure label="Peso" value={`${assessment.weightKg} kg`} />
                <Measure label="Altura" value={`${(assessment.heightCm / 100).toFixed(2).replace('.', ',')} m`} />
                {bmi ? <Measure label="IMC" value={bmi.toFixed(1).replace('.', ',')} /> : null}
                {assessment.bodyFatPercent != null ? <Measure label="Gordura" value={`${assessment.bodyFatPercent}%`} /> : null}
              </View>
              {assessment.notes ? <Text style={[s.cardText, { marginTop: 12 }]}>{assessment.notes}</Text> : null}
            </>
          ) : (
            <Text style={s.cardText}>Você ainda não tem avaliação registrada. Agende a sua na recepção.</Text>
          )}
        </Card>

        <Pressable style={({ pressed }) => [s.logout, pressed && { opacity: 0.7 }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={s.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

function Measure({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.measure}>
      <Text style={s.measureValue}>{value}</Text>
      <Text style={s.measureLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  name: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  email: { color: colors.muted, fontSize: 14, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center' },
  statValue: { color: colors.accent, fontSize: 26, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2, textAlign: 'center' },
  section: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 24 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  cardText: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  measures: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  measure: { backgroundColor: colors.bg, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 10, minWidth: 74 },
  measureValue: { fontSize: 17, fontWeight: '800', color: colors.ink },
  measureLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, height: 50, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
})
