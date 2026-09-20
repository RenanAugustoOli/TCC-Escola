const DAYS_PER_MONTH = 30

export function calculateMRR(activeSubscriptions: { plan: { price: number; durationDays: number } }[]): number {
  return activeSubscriptions.reduce((sum, { plan }) => {
    const monthlyEquivalent = plan.price * (DAYS_PER_MONTH / plan.durationDays)
    return sum + monthlyEquivalent
  }, 0)
}

export function calculateChurnRate(input: { cancelledInPeriod: number; activeAtStartOfPeriod: number }): number {
  if (input.activeAtStartOfPeriod === 0) return 0
  return (input.cancelledInPeriod / input.activeAtStartOfPeriod) * 100
}
