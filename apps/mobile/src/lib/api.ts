import axios from 'axios'
import { storage } from '@/lib/storage'

// A API mora dentro do app web (rotas /api do Next). Para apontar para um servidor local,
// defina EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:3000/api) em apps/mobile/.env
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://web-mauve-nine-74.vercel.app/api'

export const api = axios.create({ baseURL: API_URL, timeout: 70_000 })

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !String(err.config?.url ?? '').includes('/auth/login')) {
      await storage.deleteItem('token')
      onUnauthorized?.()
    }
    return Promise.reject(err)
  }
)

export function errorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  if (typeof message === 'string') return message
  if ((err as { response?: unknown })?.response === undefined) return 'Sem conexão com o servidor.'
  return fallback
}
