import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api, errorMessage } from '@/lib/api'
import { confirmAction } from '@/lib/dialog'
import { Banner, Loading, ScreenHeader } from '@/components/ui'
import { colors, radius } from '@/theme'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

const SUGGESTIONS = [
  'O que comer antes do treino?',
  'Monte um cardápio de um dia para ganhar massa',
  'Ideias de lanches práticos com proteína',
  'Quanta água devo beber por dia?',
]

const QUERY_KEY = ['nutrition-chat']

export default function NutriScreen() {
  const queryClient = useQueryClient()
  const scrollRef = useRef<ScrollView>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState<string | null>(null)

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: QUERY_KEY,
    queryFn: () => api.get('/nutrition/chat').then((r) => r.data),
  })

  const send = useMutation({
    mutationFn: (message: string) => api.post<ChatMessage>('/nutrition/chat', { message }).then((r) => r.data),
    onMutate: (message) => setSending(message),
    onSuccess: (reply, message) => {
      queryClient.setQueryData<ChatMessage[]>(QUERY_KEY, (prev = []) => [
        ...prev,
        { id: `local-${reply.id}`, role: 'user', content: message, createdAt: reply.createdAt },
        reply,
      ])
    },
    // A pergunta volta para o campo para o aluno poder tentar de novo sem redigitar
    onError: (_err, message) => setText((current) => current || message),
    onSettled: () => setSending(null),
  })

  const clear = useMutation({
    mutationFn: () => api.delete('/nutrition/chat'),
    onSuccess: () => queryClient.setQueryData(QUERY_KEY, []),
  })

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    return () => clearTimeout(timer)
  }, [messages.length, sending])

  const submit = (value: string) => {
    const message = value.trim()
    if (!message || send.isPending) return
    setText('')
    send.reset()
    send.mutate(message)
  }

  if (isLoading) return <Loading />

  const empty = messages.length === 0 && !sending

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title="Nutri"
        subtitle="Sua nutricionista de IA"
        right={
          messages.length > 0 ? (
            <Pressable
              hitSlop={12}
              style={s.clearBtn}
              accessibilityLabel="Apagar conversa"
              onPress={() => confirmAction('Apagar conversa', 'Todo o histórico com a Nutri será apagado.', 'Apagar', () => clear.mutate())}
            >
              <Ionicons name="trash-outline" size={19} color={colors.muted} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView ref={scrollRef} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {empty && (
          <View style={s.intro}>
            <View style={s.introIcon}><Ionicons name="nutrition" size={30} color={colors.success} /></View>
            <Text style={s.introTitle}>Como posso ajudar na sua alimentação?</Text>
            <Text style={s.introText}>
              Pergunte sobre refeições, calorias, proteínas e hábitos para o seu objetivo. Eu levo em conta seus treinos e sua última avaliação física.
            </Text>
            <View style={s.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable key={suggestion} style={({ pressed }) => [s.suggestion, pressed && { opacity: 0.7 }]} onPress={() => submit(suggestion)}>
                  <Text style={s.suggestionText}>{suggestion}</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((m) => (
          <View key={m.id} style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleBot]}>
            <Text style={[s.bubbleText, m.role === 'user' && { color: '#fff' }]} selectable>{m.content}</Text>
          </View>
        ))}

        {sending && (
          <>
            <View style={[s.bubble, s.bubbleUser]}>
              <Text style={[s.bubbleText, { color: '#fff' }]}>{sending}</Text>
            </View>
            <View style={[s.bubble, s.bubbleBot, s.typing]}>
              <ActivityIndicator size="small" color={colors.muted} />
              <Text style={s.typingText}>Nutri está escrevendo…</Text>
            </View>
          </>
        )}

        {send.isError && <Banner message={errorMessage(send.error, 'Não foi possível falar com a Nutri.')} />}
      </ScrollView>

      <View style={s.composer}>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="Escreva sua pergunta"
            placeholderTextColor={colors.faint}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[s.sendBtn, (!text.trim() || send.isPending) && { opacity: 0.4 }]}
            onPress={() => submit(text)}
            disabled={!text.trim() || send.isPending}
            accessibilityLabel="Enviar"
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
        <Text style={s.disclaimer}>Orientação educativa. Não substitui consulta com nutricionista ou médico.</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16, flexGrow: 1, maxWidth: 560, width: '100%', alignSelf: 'center' },
  clearBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  intro: { paddingTop: 8 },
  introIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  introTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.4, lineHeight: 28 },
  introText: { fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: 8 },
  suggestions: { marginTop: 20, gap: 10 },
  suggestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14 },
  suggestionText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  bubble: { maxWidth: '86%', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 10 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: colors.ink },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typingText: { fontSize: 14, color: colors.muted },
  composer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg, maxWidth: 560, width: '100%', alignSelf: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, minHeight: 46, maxHeight: 120, backgroundColor: colors.surface, borderRadius: 23, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: colors.ink },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: 11, color: colors.faint, textAlign: 'center', marginTop: 8 },
})
