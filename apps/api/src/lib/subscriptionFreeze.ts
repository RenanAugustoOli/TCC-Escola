export function extendEndDateByFrozenDays(input: { endDate: Date; frozenAt: Date; now: Date }): Date {
  const frozenMs = input.now.getTime() - input.frozenAt.getTime()
  return new Date(input.endDate.getTime() + frozenMs)
}
