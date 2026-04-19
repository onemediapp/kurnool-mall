import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus, BookingStatus, ServiceCategorySlug } from '@/lib/types'

// Tailwind class merger
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Indian Rupee format: ₹1,499
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Delivery fee: free >= ₹499, else ₹20 base + ₹5/km beyond 2km
export function calculateDeliveryFee(subtotal: number, distanceKm?: number): number {
  if (subtotal >= 499) return 0
  const base = 20
  const extraKm = distanceKm && distanceKm > 2 ? distanceKm - 2 : 0
  return base + extraKm * 5
}

// Date: "12 Apr 2026, 03:45 PM"
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString))
}

// Discount percentage
export function discountPercent(mrp: number, selling: number): number {
  if (mrp <= 0 || selling >= mrp) return 0
  return Math.round(((mrp - selling) / mrp) * 100)
}

// Order status human labels
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// Order status Tailwind color classes (background + text)
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

// Indian phone validation: 10 digits starting with 6-9
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return /^[6-9]\d{9}$/.test(cleaned)
}

// Format to E.164: +919876543210
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  return `+${cleaned}`
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Get initials from name
export function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Category emoji map (for UI display)
export const CATEGORY_EMOJIS: Record<string, string> = {
  grocery: '🛒',
  electronics: '📱',
  fashion: '👗',
  electricals: '💡',
  plumbing: '🔧',
  'building-materials': '🧱',
  stationery: '📝',
  'sweets-snacks': '🍬',
}

// ── Loyalty helpers ───────────────────────────────────────────
import type { LoyaltyTier } from '@/lib/types'

export function getLoyaltyTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= 2500) return 'platinum'
  if (lifetimePoints >= 800) return 'gold'
  if (lifetimePoints >= 200) return 'silver'
  return 'bronze'
}

export const TIER_CONFIG = {
  bronze: {
    label: 'Bronze', color: '#92400E', bg: 'bg-amber-50', icon: '🥉',
    minPoints: 0, pointsRate: 1,
  },
  silver: {
    label: 'Silver', color: '#64748B', bg: 'bg-slate-50', icon: '🥈',
    minPoints: 200, pointsRate: 1.5,
  },
  gold: {
    label: 'Gold', color: '#D97706', bg: 'bg-yellow-50', icon: '🥇',
    minPoints: 800, pointsRate: 2,
  },
  platinum: {
    label: 'Platinum', color: '#7C3AED', bg: 'bg-violet-50', icon: '💎',
    minPoints: 2500, pointsRate: 3,
  },
} as const

// ── Time helpers ──────────────────────────────────────────────
export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  })
}

// ── Countdown helper ─────────────────────────────────────────
export function getCountdown(endsAt: string): {
  hours: number; minutes: number; seconds: number; expired: boolean
} {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true }
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1_000)
  return { hours, minutes, seconds, expired: false }
}

// ── Number helpers ────────────────────────────────────────────
export function formatCompact(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`
  return formatPrice(n)
}

// ── Chart colors ──────────────────────────────────────────────
export const CHART_COLORS = [
  '#1A56DB', '#F59E0B', '#16A34A', '#DC2626', '#8B5CF6', '#EC4899',
] as const

// ── Enhanced order status labels ──────────────────────────────
export const ORDER_PROGRESS_STEPS = [
  'pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered',
] as const

export type ProgressStep = typeof ORDER_PROGRESS_STEPS[number]

// ═══════════════════════════════════════════════════════════════
// v3 — Services Vertical constants
// ═══════════════════════════════════════════════════════════════

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  en_route: 'En Route',
  in_progress: 'In Progress',
  completed: 'Completed',
  paid: 'Paid',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  en_route: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-800',
}

export const BOOKING_PROGRESS_STEPS = [
  'pending', 'confirmed', 'en_route', 'in_progress', 'completed', 'paid',
] as const satisfies readonly BookingStatus[]

export type BookingProgressStep = typeof BOOKING_PROGRESS_STEPS[number]

export const SERVICE_CATEGORY_META: Record<ServiceCategorySlug, { emoji: string; color: string }> = {
  electrician:           { emoji: '⚡', color: '#F59E0B' },
  plumber:               { emoji: '🔧', color: '#0EA5E9' },
  carpenter:             { emoji: '🪚', color: '#A16207' },
  ac_mechanic:           { emoji: '❄️', color: '#06B6D4' },
  refrigerator_mechanic: { emoji: '🧊', color: '#3B82F6' },
  car_mechanic:          { emoji: '🚗', color: '#DC2626' },
  bike_mechanic:         { emoji: '🏍️', color: '#EA580C' },
  house_cleaning:        { emoji: '🧹', color: '#10B981' },
  packers_movers:        { emoji: '📦', color: '#8B5CF6' },
  function_hall:         { emoji: '🎉', color: '#EC4899' },
  painter:               { emoji: '🎨', color: '#F97316' },
  pest_control:          { emoji: '🐛', color: '#65A30D' },
  cctv_installation:     { emoji: '📹', color: '#475569' },
  inverter_ups:          { emoji: '🔋', color: '#16A34A' },
}

// Campaign/notification helpers
export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  push: 'Push Notification',
  whatsapp: 'WhatsApp',
  email: 'Email',
  in_app_banner: 'In-App Banner',
  promotional_banner: 'Promotional Banner',
}

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-amber-100 text-amber-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}
