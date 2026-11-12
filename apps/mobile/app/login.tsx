import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { errorMessage } from '@/lib/api'
import { Banner, Button } from '@/components/ui'
import { colors, radius } from '@/theme'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const user = await login(email, password)
      if (user.role !== 'MEMBER') {
        setError('Este app é para alunos. A equipe acessa pelo painel web.')
        return
      }
      router.replace('/(tabs)/home')
    } catch (err) {
      setError(errorMessage(err, 'E-mail ou senha inválidos.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <View style={s.logo}>
          <Ionicons name="barbell" size={34} color="#fff" />
        </View>
        <Text style={s.title}>GymTech</Text>
        <Text style={s.subtitle}>Seus treinos, aulas e nutrição em um só lugar.</Text>

        <View style={s.form}>
          {error && <Banner message={error} />}
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            placeholder="voce@exemplo.com"
            placeholderTextColor={colors.faint}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <Text style={s.label}>Senha</Text>
          <TextInput
            style={s.input}
            placeholder="Sua senha"
            placeholderTextColor={colors.faint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          <View style={{ marginTop: 20 }}>
            <Button label="Entrar" onPress={handleLogin} loading={loading} />
          </View>
        </View>

        <Text style={s.help}>Ainda não tem acesso? Fale com a recepção da academia.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 36, fontWeight: '900', color: colors.ink, letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 16, marginTop: 6, marginBottom: 32, lineHeight: 22 },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: 16, height: 50, color: colors.ink, fontSize: 16 },
  help: { color: colors.muted, textAlign: 'center', fontSize: 13, marginTop: 24 },
})
