import { describe, expect, test } from 'vitest'
import { calculateChurnRate, calculateMRR } from './metrics'

describe('calculateMRR', () => {
  test('normaliza um plano mensal (30 dias) para receita mensal', () => {
    const mrr = calculateMRR([{ plan: { price: 100, durationDays: 30 } }])

    expect(mrr).toBe(100)
  })

  test('normaliza um plano anual (365 dias) para receita mensal proporcional', () => {
    const mrr = calculateMRR([{ plan: { price: 1200, durationDays: 365 } }])

    expect(mrr).toBeCloseTo(98.63, 2)
  })
})

describe('calculateChurnRate', () => {
  test('calcula a porcentagem de assinaturas canceladas em relação ao total ativo no início do período', () => {
    const churn = calculateChurnRate({ cancelledInPeriod: 5, activeAtStartOfPeriod: 100 })

    expect(churn).toBe(5)
  })

  test('retorna 0 quando não havia assinaturas ativas no início do período', () => {
    const churn = calculateChurnRate({ cancelledInPeriod: 0, activeAtStartOfPeriod: 0 })

    expect(churn).toBe(0)
  })
})
