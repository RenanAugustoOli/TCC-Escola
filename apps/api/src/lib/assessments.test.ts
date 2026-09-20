import { describe, expect, test } from 'vitest'
import { calculateBMI } from './assessments'

describe('calculateBMI', () => {
  test('calcula o IMC a partir do peso em kg e altura em cm', () => {
    const bmi = calculateBMI({ weightKg: 70, heightCm: 175 })

    expect(bmi).toBeCloseTo(22.86, 2)
  })
})
