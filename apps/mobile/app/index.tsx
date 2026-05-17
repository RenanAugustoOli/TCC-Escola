import { Redirect } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  return <Redirect href={user ? '/(tabs)/home' : '/login'} />
}
