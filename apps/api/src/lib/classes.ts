export interface ScheduleInput {
  id: string
  weekday: number
  startTime: string
  isActive: boolean
}

export interface Occurrence {
  scheduleId: string
  date: string
  startsAt: Date
}

export type BookingRefusal = 'FULL' | 'ALREADY_BOOKED' | 'NO_ACTIVE_SUBSCRIPTION' | 'ALREADY_STARTED'

export type BookingCheck = { ok: true } | { ok: false; reason: BookingRefusal }

export interface BookingCheckInput {
  capacity: number
  bookedCount: number
  alreadyBooked: boolean
  hasActiveSubscription: boolean
  startsAt: Date
  now: Date
}

export interface CancelInput {
  isOwner: boolean
  isStaff: boolean
  startsAt: Date
  now: Date
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getStartsAt(date: string, startTime: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = startTime.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

export function getUpcomingOccurrences(schedules: ScheduleInput[], from: Date, days: number): Occurrence[] {
  const occurrences: Occurrence[] = []

  for (let offset = 0; offset < days; offset++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset)
    const date = formatLocalDate(day)

    for (const schedule of schedules) {
      if (!schedule.isActive || schedule.weekday !== day.getDay()) continue
      occurrences.push({
        scheduleId: schedule.id,
        date,
        startsAt: getStartsAt(date, schedule.startTime),
      })
    }
  }

  return occurrences.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

export function checkBooking(input: BookingCheckInput): BookingCheck {
  if (input.startsAt <= input.now) return { ok: false, reason: 'ALREADY_STARTED' }
  if (input.alreadyBooked) return { ok: false, reason: 'ALREADY_BOOKED' }
  if (!input.hasActiveSubscription) return { ok: false, reason: 'NO_ACTIVE_SUBSCRIPTION' }
  if (input.bookedCount >= input.capacity) return { ok: false, reason: 'FULL' }
  return { ok: true }
}

export function canCancelBooking(input: CancelInput): boolean {
  if (input.isStaff) return true
  return input.isOwner && input.startsAt > input.now
}
