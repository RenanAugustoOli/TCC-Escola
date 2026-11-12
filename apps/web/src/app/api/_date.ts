// A academia opera no horário de Brasília (UTC-3, sem horário de verão); o servidor roda em UTC.
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000

export function brtDateString(date: Date = new Date()): string {
  return new Date(date.getTime() - BRT_OFFSET_MS).toISOString().slice(0, 10)
}

export function startOfBrtDay(date: Date = new Date()): Date {
  return new Date(`${brtDateString(date)}T00:00:00-03:00`)
}

export function brtWeekday(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00-03:00`).getUTCDay()
}

export function brtDateTime(dateStr: string, time: string): Date {
  return new Date(`${dateStr}T${time}:00-03:00`)
}
