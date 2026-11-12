import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AgendaItem } from '@academia/shared'
import { api, errorMessage } from '@/lib/api'
import { formatTime, relativeDay, useAgenda } from '@/lib/data'
import { Banner, Button, Card, EmptyState, Loading, Pill, ScreenHeader } from '@/components/ui'
import { colors } from '@/theme'

export default function AulasScreen() {
  const queryClient = useQueryClient()
  const { data: agenda = [], isLoading, isRefetching, refetch } = useAgenda()

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['agenda'] })

  const book = useMutation({
    mutationFn: (item: AgendaItem) => api.post(`/classes/${item.scheduleId}/bookings`, { date: item.date }),
    onSettled: refresh,
  })
  const cancel = useMutation({
    mutationFn: (item: AgendaItem) => api.delete(`/classes/bookings/${item.myBookingId}`),
    onSettled: refresh,
  })

  if (isLoading) return <Loading />

  const error = book.error ?? cancel.error
  const busyKey = (book.isPending && book.variables) || (cancel.isPending && cancel.variables) || null
  const upcoming = agenda.filter((a) => new Date(a.startsAt) > new Date())
  const dates = [...new Set(upcoming.map((a) => a.date))]

  return (
    <View style={s.container}>
      <ScreenHeader title="Aulas" subtitle="Reserve sua vaga nos próximos 7 dias" />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
      >
        {error && <Banner message={errorMessage(error, 'Não foi possível concluir a ação.')} />}

        {upcoming.length === 0 && (
          <EmptyState icon="calendar-outline" title="Nenhuma aula nos próximos dias" text="Volte mais tarde para ver a agenda atualizada." />
        )}

        {dates.map((date) => (
          <View key={date}>
            <Text style={s.section}>{relativeDay(date)}</Text>
            {upcoming.filter((a) => a.date === date).map((item) => {
              const full = item.spotsLeft === 0
              const busy = busyKey?.scheduleId === item.scheduleId && busyKey?.date === item.date
              return (
                <Card key={`${item.scheduleId}-${item.date}`} style={{ marginBottom: 12 }}>
                  <View style={s.row}>
                    <View style={s.time}>
                      <Text style={s.timeText}>{formatTime(item.startsAt)}</Text>
                      <Text style={s.duration}>{item.durationMinutes} min</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.name}>{item.name}</Text>
                      <Text style={s.meta}>com {item.instructor.name}</Text>
                      {item.description ? <Text style={s.meta}>{item.description}</Text> : null}
                      <View style={s.pills}>
                        {item.bookedByMe ? (
                          <Pill label="Vaga reservada" tone="success" />
                        ) : full ? (
                          <Pill label="Lotada" tone="danger" />
                        ) : (
                          <Pill label={`${item.spotsLeft} ${item.spotsLeft === 1 ? 'vaga' : 'vagas'}`} tone={item.spotsLeft <= 3 ? 'warn' : 'neutral'} />
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={{ marginTop: 14 }}>
                    {item.bookedByMe ? (
                      <Button label="Cancelar reserva" variant="secondary" onPress={() => cancel.mutate(item)} loading={busy} />
                    ) : (
                      <Button label={full ? 'Sem vagas' : 'Reservar vaga'} onPress={() => book.mutate(item)} loading={busy} disabled={full} />
                    )}
                  </View>
                </Card>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center' },
  section: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
  row: { flexDirection: 'row', gap: 16 },
  time: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, minWidth: 68, alignSelf: 'flex-start' },
  timeText: { fontSize: 18, fontWeight: '800', color: colors.ink },
  duration: { fontSize: 12, color: colors.muted, marginTop: 2 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
  pills: { flexDirection: 'row', marginTop: 8 },
})
