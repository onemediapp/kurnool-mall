import type { BookingStatus } from '@kurnool-mall/shared-types'

// Client-side mirror of the authoritative transition_booking_status FSM.
// Keep in sync with supabase/migrations/004_services_and_growth.sql.
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['en_route', 'cancelled'],
  en_route: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: ['paid'],
  paid: [],
  cancelled: [],
  rejected: [],
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from]?.includes(to) ?? false
}

export function allowedNextStatuses(from: BookingStatus): BookingStatus[] {
  return BOOKING_TRANSITIONS[from] ?? []
}

export function isTerminalBookingStatus(s: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[s]?.length === 0
}
