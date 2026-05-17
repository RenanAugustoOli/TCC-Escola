import axios from 'axios'
import { storage } from '@/lib/storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await storage.deleteItem('token')
    }
    return Promise.reject(err)
  }
)
