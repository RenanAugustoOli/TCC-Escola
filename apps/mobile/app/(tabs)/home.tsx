import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

export default function HomeScreen() {
  const { user } = useAuth()

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => api.get(`/users/${user?.id}/subscriptions`).then((r) => r.data),
    enabled: !!user,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['workout-history'],
    queryFn: () => api.get('/workouts/my/history').then((r) => r.data),
  })

  const activeSub = subscriptions.find((s: any) => s.status === 'ACTIVE')
  const daysLeft = activeSub
    ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Olá, {user?.name?.split(' ')[0]}!</Text>
          <Text style={s.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      {activeSub ? (
        <View style={s.card}>
          <View style={s.cardRow}>
            <View>
              <Text style={s.cardLabel}>Plano Ativo</Text>
              <Text style={s.cardTitle}>{activeSub.plan.name}</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeText}>Ativo</Text>
            </View>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${Math.min(100, (1 - daysLeft / activeSub.plan.durationDays) * 100)}%` }]} />
          </View>
          <Text style={s.cardSub}>{daysLeft} dias restantes</Text>
        </View>
      ) : (
        <TouchableOpacity style={s.alertCard} onPress={() => router.push('/(tabs)/assinatura')}>
          <Ionicons name="alert-circle" size={24} color="#2563eb" />
          <Text style={s.alertText}>Você não tem assinatura ativa. Clique para ver os planos.</Text>
        </TouchableOpacity>
      )}

      <Text style={s.sectionTitle}>Atividade Recente</Text>

      {history.length === 0 ? (
        <View style={s.emptyCard}>
          <Ionicons name="barbell-outline" size={40} color="#4b5563" />
          <Text style={s.emptyText}>Nenhum treino registrado ainda</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/treinos')}>
            <Text style={s.emptyLink}>Ver treinos disponíveis</Text>
          </TouchableOpacity>
        </View>
      ) : (
        history.slice(0, 5).map((log: any) => (
          <View key={log.id} style={s.historyItem}>
            <View style={s.historyIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.historyName}>{log.workout.name}</Text>
              <Text style={s.historyDate}>
                {new Date(log.completedAt).toLocaleDateString('pt-BR')} • {log.workout.durationMinutes} min
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  date: { color: '#9ca3af', marginTop: 2, textTransform: 'capitalize' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardLabel: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  badge: { backgroundColor: '#065f46', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#34d399', fontSize: 12, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 3 },
  cardSub: { color: '#9ca3af', fontSize: 13 },
  alertCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertText: { color: '#d1d5db', flex: 1, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  emptyCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 32, alignItems: 'center', gap: 12 },
  emptyText: { color: '#6b7280', fontSize: 14 },
  emptyLink: { color: '#2563eb', fontWeight: '600' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  historyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#064e3b', justifyContent: 'center', alignItems: 'center' },
  historyName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  historyDate: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
})
