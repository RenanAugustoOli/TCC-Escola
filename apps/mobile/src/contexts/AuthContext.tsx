import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@academia/shared'
import { api } from '@/lib/api'
import { storage } from '@/lib/storage'

interface AuthContextData {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    storage.getItem('token').then((token) => {
      if (token) {
        api.get('/auth/me')
          .then((res) => setUser(res.data))
          .catch(() => storage.deleteItem('token'))
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password })
    await storage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    await storage.deleteItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
