import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import type { Plan } from '@academia/shared'
import { api } from '@/lib/api'
import { daysLeft, useSubscriptions } from '@/lib/data'
import { Banner, Card, Loading, Pill, ScreenHeader } from '@/components/ui'
import { colors, radius } from '@/theme'

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AssinaturaScreen() {
  const { data: subscriptions = [], isLoading: loadingSubs } = useSubscriptions()
  const { data: plans = [], isLoading: loadingPlans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  })

  if (loadingSubs || loadingPlans) return <Loading />

  const activeSub = subscriptions.find((sub) => sub.status === 'ACTIVE')
  const latestSub = subscriptions[0]
  const remaining = activeSub ? daysLeft(activeSub.endDate) : 0
  const total = activeSub?.plan?.durationDays ?? 30
  const progress = Math.max(0, Math.min(1, (total - remaining) / total))

  return (
    <View style={s.container}>
      <ScreenHeader title="Assinatura" back />
      <ScrollView contentContainerStyle={s.content}>
        {activeSub?.plan ? (
          <View style={s.active}>
            <View style={s.rowBetween}>
              <Text style={s.activeLabel}>PLANO ATUAL</Text>
              <Pill label="Ativa" tone="success" />
            </View>
            <Text style={s.activeName}>{activeSub.plan.name}</Text>
            <Text style={s.activePrice}>
              {money(activeSub.plan.price)} <Text style={s.activePer}>a cada {activeSub.plan.durationDays} dias</Text>
            </Text>
            <View style={s.track}>
              <View style={[s.fill, { width: `${progress * 100}%` }, remaining <= 7 && { backgroundColor: '#F5B841' }]} />
            </View>
            <View style={s.rowBetween}>
              <Text style={s.activeHint}>{remaining} {remaining === 1 ? 'dia restante' : 'dias restantes'}</Text>
              <Text style={s.activeHint}>Vence em {new Date(activeSub.endDate).toLocaleDateString('pt-BR')}</Text>
            </View>
          </View>
        ) : (
          <Banner
            tone="warn"
            message={
              latestSub?.status === 'OVERDUE'
                ? 'Sua mensalidade está em atraso. Regularize para voltar a acessar os treinos.'
                : latestSub?.status === 'FROZEN'
                  ? 'Seu plano está trancado. Fale com a recepção para reativar.'
                  : 'Você não tem um plano ativo no momento.'
            }
          />
        )}

        <Banner tone="success" message="Em breve você poderá pagar e renovar pelo app. Por enquanto, a renovação é feita na recepção." />

        <Text style={s.section}>Planos da academia</Text>
        {plans.map((plan) => {
          const current = activeSub?.planId === plan.id
          return (
            <Card key={plan.id} style={[{ marginBottom: 12 }, current ? s.currentPlan : {}]}>
              <View style={s.rowBetween}>
                <Text style={s.planName}>{plan.name}</Text>
                {current && <Pill label="Seu plano" tone="accent" />}
              </View>
              <Text style={s.planPrice}>
                {money(plan.price)} <Text style={s.planPer}>/ {plan.durationDays} dias</Text>
              </Text>
              {plan.description ? <Text style={s.planDesc}>{plan.description}</Text> : null}
              <View style={s.features}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={s.feature}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={s.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )
        })}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  active: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: 22, marginBottom: 14 },
  activeLabel: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  activeName: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 8 },
  activePrice: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 },
  activePer: { color: '#B9B9C0', fontWeight: '400', fontSize: 14 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#34343A', overflow: 'hidden', marginTop: 18, marginBottom: 10 },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent },
  activeHint: { color: '#B9B9C0', fontSize: 13 },
  section: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 12 },
  currentPlan: { borderWidth: 2, borderColor: colors.accent },
  planName: { fontSize: 18, fontWeight: '800', color: colors.ink },
  planPrice: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 6 },
  planPer: { fontSize: 14, fontWeight: '400', color: colors.muted },
  planDesc: { fontSize: 14, color: colors.muted, marginTop: 6, lineHeight: 20 },
  features: { gap: 8, marginTop: 14 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { flex: 1, fontSize: 14, color: colors.ink },
})
