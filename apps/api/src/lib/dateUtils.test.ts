import { describe, expect, test } from 'vitest'
import { startOfLocalDay } from './dateUtils'

describe('startOfLocalDay', () => {
  test('zera o horário mantendo o dia local', () => {
    expect(startOfLocalDay(new Date(2026, 8, 20, 18, 45, 30, 500))).toEqual(new Date(2026, 8, 20, 0, 0, 0, 0))
  })

  test('não altera uma data que já está à meia-noite', () => {
    const midnight = new Date(2026, 0, 1, 0, 0, 0, 0)
    expect(startOfLocalDay(midnight)).toEqual(midnight)
  })

  test('não modifica o Date recebido', () => {
    const original = new Date(2026, 8, 20, 18, 45)
    startOfLocalDay(original)
    expect(original).toEqual(new Date(2026, 8, 20, 18, 45))
  })
})
