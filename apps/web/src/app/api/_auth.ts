import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'gymtech-super-secret-2024'
)

export async function verifyAuth(req: NextRequest): Promise<{ sub: string; role: string }> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized')
  const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
  return { sub: payload.sub as string, role: payload.role as string }
}
