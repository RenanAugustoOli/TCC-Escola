import { describe, expect, test } from 'vitest'
import { extendEndDateByFrozenDays } from './subscriptionFreeze'

describe('extendEndDateByFrozenDays', () => {
  test('soma ao endDate a quantidade de dias que a assinatura ficou congelada', () => {
    const frozenAt = new Date('2026-08-01T00:00:00Z')
    const now = new Date('2026-08-06T00:00:00Z')
    const endDate = new Date('2026-08-20T00:00:00Z')

    const newEndDate = extendEndDateByFrozenDays({ endDate, frozenAt, now })

    expect(newEndDate).toEqual(new Date('2026-08-25T00:00:00Z'))
  })
})
