import { NextRequest, NextResponse } from 'next/server'

// O app mobile (Expo web em desenvolvimento) chama a API de outra origem. A autenticação é por
// token Bearer, sem cookies, então liberar qualquer origem não expõe sessão de ninguém.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  }
  const res = NextResponse.next()
  for (const [key, value] of Object.entries(CORS_HEADERS)) res.headers.set(key, value)
  return res
}

export const config = { matcher: '/api/:path*' }
