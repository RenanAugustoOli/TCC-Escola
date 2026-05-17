import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Atenção', 'Preencha todos os campos')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role === 'PERSONAL_TRAINER') {
        Alert.alert('Acesso negado', 'Trainers devem acessar pela plataforma web.')
        return
      }
      router.replace('/(tabs)/home')
    } catch {
      Alert.alert('Erro', 'Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        <View style={s.logo}>
          <Text style={s.logoLetter}>G</Text>
        </View>
        <Text style={s.title}>GymTech</Text>
        <Text style={s.subtitle}>Faça login para continuar</Text>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor="#6b7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            placeholder="Senha"
            placeholderTextColor="#6b7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  logoLetter: { fontSize: 36, fontWeight: '900', color: '#fff' },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: '#94a3b8', textAlign: 'center', marginTop: 4, marginBottom: 36 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: '#fff', fontSize: 15,
    borderWidth: 1, borderColor: '#334155',
  },
  btn: {
    backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})
