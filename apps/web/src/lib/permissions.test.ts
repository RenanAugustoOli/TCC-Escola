import { describe, expect, test } from 'vitest'
import { canAccessDashboardPath } from './permissions'

describe('canAccessDashboardPath', () => {
  test('recepção pode acessar /dashboard/alunos', () => {
    expect(canAccessDashboardPath('RECEPTIONIST', '/dashboard/alunos')).toBe(true)
  })

  test('recepção pode acessar subpáginas de alunos, como o perfil de um aluno', () => {
    expect(canAccessDashboardPath('RECEPTIONIST', '/dashboard/alunos/123')).toBe(true)
  })

  test('recepção não pode acessar planos', () => {
    expect(canAccessDashboardPath('RECEPTIONIST', '/dashboard/planos')).toBe(false)
  })

  test('admin pode acessar qualquer rota do dashboard', () => {
    expect(canAccessDashboardPath('ADMIN', '/dashboard/planos')).toBe(true)
  })

  test('recepção pode acessar a agenda de aulas', () => {
    expect(canAccessDashboardPath('RECEPTIONIST', '/dashboard/aulas')).toBe(true)
  })
})
