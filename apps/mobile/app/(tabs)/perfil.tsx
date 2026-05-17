import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function PerfilScreen() {
  const { user, logout } = useAuth()

  const { data: history = [] } = useQuery({
    queryKey: ['workout-history'],
    queryFn: () => api.get('/workouts/my/history').then((r) => r.data),
  })

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive', onPress: async () => {
          await logout()
          router.replace('/login')
        }
      },
    ])
  }

  const totalMinutes = history.reduce((acc: number, log: any) => acc + log.workout.durationMinutes, 0)

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.profileHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        {user?.phone && <Text style={s.phone}>{user.phone}</Text>}
      </View>

      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{history.length}</Text>
          <Text style={s.statLabel}>Treinos</Text>
        </View>
        <View style={[s.statBox, s.statMiddle]}>
          <Text style={s.statValue}>{Math.round(totalMinutes / 60)}h</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>
            {history.length > 0
              ? Math.round(totalMinutes / history.length)
              : 0}min
          </Text>
          <Text style={s.statLabel}>Média/treino</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Conta</Text>
        <TouchableOpacity style={s.menuItem}>
          <Ionicons name="person-outline" size={20} color="#9ca3af" />
          <Text style={s.menuText}>Editar Perfil</Text>
          <Ionicons name="chevron-forward" size={16} color="#4b5563" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem}>
          <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
          <Text style={s.menuText}>Alterar Senha</Text>
          <Ionicons name="chevron-forward" size={16} color="#4b5563" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Suporte</Text>
        <TouchableOpacity style={s.menuItem}>
          <Ionicons name="help-circle-outline" size={20} color="#9ca3af" />
          <Text style={s.menuText}>Ajuda</Text>
          <Ionicons name="chevron-forward" size={16} color="#4b5563" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#f87171" />
        <Text style={s.logoutText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  email: { color: '#9ca3af', marginTop: 4 },
  phone: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16, marginBottom: 24, overflow: 'hidden' },
  statBox: { flex: 1, padding: 16, alignItems: 'center' },
  statMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#374151' },
  statValue: { color: '#2563eb', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#6b7280', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 6 },
  menuText: { color: '#e5e7eb', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#7f1d1d' },
  logoutText: { color: '#f87171', fontWeight: '600', fontSize: 15 },
})
