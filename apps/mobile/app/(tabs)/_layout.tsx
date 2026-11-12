import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { Loading } from '@/components/ui'
import { colors } from '@/theme'

type IconName = keyof typeof Ionicons.glyphMap

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'home', title: 'Início', icon: 'home-outline', iconActive: 'home' },
  { name: 'treinos', title: 'Treinos', icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'aulas', title: 'Aulas', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'nutri', title: 'Nutri', icon: 'nutrition-outline', iconActive: 'nutrition' },
  { name: 'perfil', title: 'Perfil', icon: 'person-outline', iconActive: 'person' },
]

export default function TabsLayout() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Redirect href="/login" />

  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? tab.iconActive : tab.icon} size={23} color={color} />,
          }}
        />
      ))}
    </Tabs>
  )
}
