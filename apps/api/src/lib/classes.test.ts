import { describe, expect, test } from 'vitest'
import {
  canCancelBooking,
  checkBooking,
  formatLocalDate,
  getStartsAt,
  getUpcomingOccurrences,
} from './classes'

const sunday = new Date(2026, 8, 20, 12, 0) // domingo, 20/09/2026

describe('formatLocalDate', () => {
  test('formata a data local como YYYY-MM-DD com zeros à esquerda', () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('getStartsAt', () => {
  test('combina a data e o horário em um Date local', () => {
    expect(getStartsAt('2026-09-22', '07:30')).toEqual(new Date(2026, 8, 22, 7, 30))
  })
})

describe('getUpcomingOccurrences', () => {
  const tuesday = { id: 's1', weekday: 2, startTime: '07:00', isActive: true }

  test('gera a aula no dia da semana certo dentro da janela', () => {
    expect(getUpcomingOccurrences([tuesday], sunday, 7)).toEqual([
      { scheduleId: 's1', date: '2026-09-22', startsAt: new Date(2026, 8, 22, 7, 0) },
    ])
  })

  test('inclui o dia de hoje e exclui o mesmo dia da semana seguinte', () => {
    const sundayClass = { id: 's2', weekday: 0, startTime: '18:00', isActive: true }
    const result = getUpcomingOccurrences([sundayClass], sunday, 7)
    expect(result.map((o) => o.date)).toEqual(['2026-09-20'])
  })

  test('repete a aula a cada semana quando a janela é maior', () => {
    const result = getUpcomingOccurrences([tuesday], sunday, 14)
    expect(result.map((o) => o.date)).toEqual(['2026-09-22', '2026-09-29'])
  })

  test('ignora turmas inativas', () => {
    expect(getUpcomingOccurrences([{ ...tuesday, isActive: false }], sunday, 7)).toEqual([])
  })

  test('ordena as ocorrências por horário de início', () => {
    const mondayEvening = { id: 's3', weekday: 1, startTime: '18:00', isActive: true }
    const tuesdayMorning = { id: 's4', weekday: 2, startTime: '09:00', isActive: true }
    const result = getUpcomingOccurrences([tuesdayMorning, mondayEvening], sunday, 7)
    expect(result.map((o) => o.scheduleId)).toEqual(['s3', 's4'])
  })
})

describe('checkBooking', () => {
  const now = new Date(2026, 8, 20, 12, 0)
  const base = {
    capacity: 10,
    bookedCount: 3,
    alreadyBooked: false,
    hasActiveSubscription: true,
    startsAt: new Date(2026, 8, 22, 7, 0),
    now,
  }

  test('aceita quando há vaga, assinatura ativa e a aula ainda não começou', () => {
    expect(checkBooking(base)).toEqual({ ok: true })
  })

  test('recusa com FULL quando a capacidade foi atingida', () => {
    expect(checkBooking({ ...base, bookedCount: 10 })).toEqual({ ok: false, reason: 'FULL' })
  })

  test('recusa com ALREADY_BOOKED quando o aluno já reservou', () => {
    expect(checkBooking({ ...base, alreadyBooked: true })).toEqual({ ok: false, reason: 'ALREADY_BOOKED' })
  })

  test('recusa com NO_ACTIVE_SUBSCRIPTION quando não há assinatura ativa', () => {
    expect(checkBooking({ ...base, hasActiveSubscription: false })).toEqual({
      ok: false,
      reason: 'NO_ACTIVE_SUBSCRIPTION',
    })
  })

  test('recusa com ALREADY_STARTED quando a aula já começou', () => {
    expect(checkBooking({ ...base, startsAt: new Date(2026, 8, 20, 11, 0) })).toEqual({
      ok: false,
      reason: 'ALREADY_STARTED',
    })
  })

  test('informa ALREADY_BOOKED antes de FULL quando as duas condições valem', () => {
    expect(checkBooking({ ...base, bookedCount: 10, alreadyBooked: true })).toEqual({
      ok: false,
      reason: 'ALREADY_BOOKED',
    })
  })
})

describe('canCancelBooking', () => {
  const now = new Date(2026, 8, 20, 12, 0)
  const future = new Date(2026, 8, 22, 7, 0)
  const past = new Date(2026, 8, 20, 11, 0)

  test('o dono cancela antes do início da aula', () => {
    expect(canCancelBooking({ isOwner: true, isStaff: false, startsAt: future, now })).toBe(true)
  })

  test('o dono não cancela depois que a aula começou', () => {
    expect(canCancelBooking({ isOwner: true, isStaff: false, startsAt: past, now })).toBe(false)
  })

  test('a equipe cancela mesmo depois que a aula começou', () => {
    expect(canCancelBooking({ isOwner: false, isStaff: true, startsAt: past, now })).toBe(true)
  })

  test('quem não é dono nem equipe não cancela', () => {
    expect(canCancelBooking({ isOwner: false, isStaff: false, startsAt: future, now })).toBe(false)
  })
})
