import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { User } from '@academia/shared'
import { api, setUnauthorizedHandler } from '@/lib/api'
import { storage } from '@/lib/storage'

interface AuthContextData {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    storage.getItem('token').then((token) => {
      if (token) {
        api.get('/auth/me')
          .then((res) => setUser(res.data.role === 'MEMBER' ? res.data : null))
          .catch(() => storage.deleteItem('token'))
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // O app é só do aluno: equipe usa o painel web, então não guardamos a sessão dela aqui.
  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password })
    if (res.data.user.role === 'MEMBER') {
      await storage.setItem('token', res.data.token)
      queryClient.clear()
      setUser(res.data.user)
    }
    return res.data.user
  }

  const logout = async () => {
    await storage.deleteItem('token')
    queryClient.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
