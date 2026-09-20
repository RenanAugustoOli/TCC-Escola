import { UserRole } from '@academia/shared'

const RECEPTIONIST_ALLOWED_PREFIXES = [
  '/dashboard/alunos',
  '/dashboard/assinaturas',
  '/dashboard/pagamentos',
  '/dashboard/aulas',
]

export function canAccessDashboardPath(role: UserRole, pathname: string): boolean {
  if (role !== 'RECEPTIONIST') return true
  return RECEPTIONIST_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
