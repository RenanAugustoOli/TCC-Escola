export function calculateBMI(input: { weightKg: number; heightCm: number }): number {
  const heightM = input.heightCm / 100
  return input.weightKg / (heightM * heightM)
}
