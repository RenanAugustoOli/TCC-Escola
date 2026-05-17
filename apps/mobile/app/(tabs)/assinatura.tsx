import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Plan, Subscription } from '@academia/shared'
import { Ionicons } from '@expo/vector-icons'

function getDaysLeft(endDate: string) {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000))
}

function getCountdownColor(days: number) {
  if (days <= 7) return { bar: '#ef4444', text: '#ef4444', bg: '#1f0707' }
  if (days <= 15) return { bar: '#f59e0b', text: '#f59e0b', bg: '#1c1207' }
  return { bar: '#2563eb', text: '#60a5fa', bg: '#0c1a3a' }
}

export default function AssinaturaScreen() {
  const { user } = useAuth()

  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery<Subscription[]>({
    queryKey: ['my-subscriptions'],
    queryFn: () => api.get(`/users/${user?.id}/subscriptions`).then((r) => r.data),
    enabled: !!user,
  })

  const { data: plans = [], isLoading: loadingPlans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  })

  const generatePayment = useMutation({
    mutationFn: ({ subscriptionId, method }: { subscriptionId: string; method: string }) =>
      api.post('/payments/generate', { subscriptionId, method }),
    onSuccess: () => Alert.alert('Sucesso', 'Pagamento gerado com sucesso!'),
  })

  const activeSub = subscriptions.find((s: any) => s.status === 'ACTIVE') as any

  const handlePayment = (subscriptionId: string) => {
    Alert.alert('Forma de Pagamento', 'Como deseja pagar?', [
      { text: 'PIX', onPress: () => generatePayment.mutate({ subscriptionId, method: 'PIX' }) },
      { text: 'Boleto', onPress: () => generatePayment.mutate({ subscriptionId, method: 'BOLETO' }) },
      { text: 'Cartão de Crédito', onPress: () => generatePayment.mutate({ subscriptionId, method: 'CREDIT_CARD' }) },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  if (loadingSubs || loadingPlans) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {activeSub ? (() => {
        const daysLeft = getDaysLeft(activeSub.endDate)
        const totalDays = activeSub.plan.durationDays
        const progress = Math.max(0, Math.min(1, (totalDays - daysLeft) / totalDays))
        const clr = getCountdownColor(daysLeft)

        return (
          <>
            <Text style={s.sectionTitle}>Assinatura Ativa</Text>
            <View style={s.activeCard}>
              <View style={s.activeRow}>
                <View>
                  <Text style={s.planLabel}>Plano atual</Text>
                  <Text style={s.planName}>{activeSub.plan.name}</Text>
                  <Text style={s.planPrice}>
                    {activeSub.plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    <Text style={s.planPer}> /{activeSub.plan.durationDays} dias</Text>
                  </Text>
                </View>
                <View style={s.activeBadge}>
                  <Text style={s.activeBadgeText}>Ativa</Text>
                </View>
              </View>

              {/* Countdown */}
              <View style={[s.countdownBox, { backgroundColor: clr.bg }]}>
                <View style={s.countdownRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time-outline" size={16} color="#94a3b8" />
                    <Text style={s.countdownLabel}>Tempo restante</Text>
                  </View>
                  <Text style={[s.countdownDays, { color: clr.text }]}>
                    {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                  </Text>
                </View>

                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: clr.bar }]} />
                </View>

                <View style={s.dateRow}>
                  <Text style={s.dateText}>Início: {new Date(activeSub.startDate).toLocaleDateString('pt-BR')}</Text>
                  <Text style={s.dateText}>Vence: {new Date(activeSub.endDate).toLocaleDateString('pt-BR')}</Text>
                </View>

                {daysLeft <= 7 && (
                  <View style={s.alertBox}>
                    <Ionicons name="alert-circle" size={13} color="#f87171" />
                    <Text style={s.alertText}>Assinatura vence em breve. Renove agora!</Text>
                  </View>
                )}
              </View>

              <View style={s.divider} />
              <TouchableOpacity style={s.payBtn} onPress={() => handlePayment(activeSub.id)} disabled={generatePayment.isPending}>
                <Ionicons name="card-outline" size={18} color="#fff" />
                <Text style={s.payBtnText}>Renovar / Pagar</Text>
              </TouchableOpacity>
            </View>
          </>
        )
      })() : (
        <View style={s.noSubCard}>
          <Ionicons name="alert-circle-outline" size={48} color="#2563eb" />
          <Text style={s.noSubTitle}>Sem assinatura ativa</Text>
          <Text style={s.noSubText}>Escolha um plano abaixo para começar</Text>
        </View>
      )}

      <Text style={[s.sectionTitle, { marginTop: 24 }]}>Planos disponíveis</Text>

      {plans.map((plan) => (
        <View key={plan.id} style={s.planCard}>
          <View style={s.planHeader}>
            <Text style={s.planCardName}>{plan.name}</Text>
            <Text style={s.planCardPrice}>
              {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
          </View>
          {plan.description && <Text style={s.planCardDesc}>{plan.description}</Text>}
          <Text style={s.planDuration}>{plan.durationDays} dias</Text>
          <View style={s.features}>
            {plan.features.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <Ionicons name="checkmark-circle" size={15} color="#34d399" />
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={s.helpText}>Para alterar seu plano, fale com a recepção da academia.</Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  activeCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 8 },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planLabel: { color: '#94a3b8', fontSize: 11, marginBottom: 3 },
  planName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  planPrice: { color: '#f1f5f9', fontSize: 15, fontWeight: '600', marginTop: 2 },
  planPer: { color: '#64748b', fontWeight: 'normal', fontSize: 13 },
  activeBadge: { backgroundColor: '#052e16', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  activeBadgeText: { color: '#34d399', fontWeight: '700', fontSize: 12 },
  countdownBox: { borderRadius: 12, padding: 14, marginBottom: 16 },
  countdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  countdownLabel: { color: '#94a3b8', fontSize: 13 },
  countdownDays: { fontSize: 26, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateText: { color: '#64748b', fontSize: 11 },
  alertBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#1f0707', borderRadius: 8, padding: 8 },
  alertText: { color: '#fca5a5', fontSize: 12, flex: 1 },
  divider: { height: 1, backgroundColor: '#334155', marginBottom: 16 },
  payBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  noSubCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 32, alignItems: 'center', gap: 8, marginBottom: 8 },
  noSubTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  noSubText: { color: '#94a3b8', textAlign: 'center' },
  planCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 18, marginBottom: 10 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  planCardName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  planCardPrice: { color: '#60a5fa', fontSize: 17, fontWeight: '800' },
  planCardDesc: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  planDuration: { color: '#475569', fontSize: 12, marginBottom: 10 },
  features: { gap: 7 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: '#cbd5e1', fontSize: 13 },
  helpText: { color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
})
