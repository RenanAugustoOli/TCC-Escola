import { describe, expect, test } from 'vitest'
import type { AgendaItem } from '@academia/shared'
import { getErrorMessage, groupAgendaByDate } from './agenda'

function item(scheduleId: string, date: string): AgendaItem {
  return {
    scheduleId,
    name: 'Spinning',
    description: null,
    instructor: { id: 'i1', name: 'Carlos' },
    date,
    startsAt: `${date}T10:00:00.000Z`,
    durationMinutes: 45,
    capacity: 10,
    bookedCount: 0,
    spotsLeft: 10,
    bookedByMe: false,
    myBookingId: null,
  }
}

describe('groupAgendaByDate', () => {
  test('agrupa aulas consecutivas da mesma data preservando a ordem', () => {
    const groups = groupAgendaByDate([
      item('a', '2026-09-21'),
      item('b', '2026-09-21'),
      item('c', '2026-09-22'),
    ])

    expect(groups.map((g) => g.date)).toEqual(['2026-09-21', '2026-09-22'])
    expect(groups[0].items.map((i) => i.scheduleId)).toEqual(['a', 'b'])
    expect(groups[1].items.map((i) => i.scheduleId)).toEqual(['c'])
  })

  test('devolve lista vazia quando não há aulas', () => {
    expect(groupAgendaByDate([])).toEqual([])
  })
})

describe('getErrorMessage', () => {
  test('usa a mensagem que veio da API', () => {
    expect(getErrorMessage({ response: { data: { message: 'Essa aula está lotada' } } })).toBe('Essa aula está lotada')
  })

  test('usa a mensagem padrão quando o erro não tem resposta da API', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('Não foi possível concluir a ação. Tente novamente.')
  })
})
