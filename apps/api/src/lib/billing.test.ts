import { describe, expect, test } from 'vitest'
import { decideBillingActions } from './billing'

function daysFromNow(now: Date, days: number) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}

describe('decideBillingActions', () => {
  test('marca como vencida uma assinatura ativa cujo endDate já passou', () => {
    const now = new Date('2026-08-25T12:00:00Z')
    const subscriptions = [
      {
        id: 'sub-1',
        status: 'ACTIVE' as const,
        endDate: daysFromNow(now, -1),
        plan: { price: 100 },
        payments: [],
      },
    ]

    const actions = decideBillingActions(subscriptions, now)

    expect(actions).toEqual([{ type: 'MARK_OVERDUE', subscriptionId: 'sub-1' }])
  })

  test('gera cobrança para assinatura ativa que vence em breve sem pagamento pendente', () => {
    const now = new Date('2026-08-25T12:00:00Z')
    const subscriptions = [
      {
        id: 'sub-2',
        status: 'ACTIVE' as const,
        endDate: daysFromNow(now, 2),
        plan: { price: 150 },
        payments: [],
      },
    ]

    const actions = decideBillingActions(subscriptions, now)

    expect(actions).toEqual([{ type: 'GENERATE_PAYMENT', subscriptionId: 'sub-2', amount: 150 }])
  })

  test('não gera cobrança duplicada quando já existe pagamento pendente para o ciclo', () => {
    const now = new Date('2026-08-25T12:00:00Z')
    const subscriptions = [
      {
        id: 'sub-3',
        status: 'ACTIVE' as const,
        endDate: daysFromNow(now, 1),
        plan: { price: 150 },
        payments: [{ status: 'PENDING' as const }],
      },
    ]

    const actions = decideBillingActions(subscriptions, now)

    expect(actions).toEqual([])
  })

  test('não faz nada para assinatura ativa longe do vencimento', () => {
    const now = new Date('2026-08-25T12:00:00Z')
    const subscriptions = [
      {
        id: 'sub-4',
        status: 'ACTIVE' as const,
        endDate: daysFromNow(now, 20),
        plan: { price: 150 },
        payments: [],
      },
    ]

    const actions = decideBillingActions(subscriptions, now)

    expect(actions).toEqual([])
  })
})
