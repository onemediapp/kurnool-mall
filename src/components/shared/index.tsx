'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import {
  X, ChevronLeft, Search, Star, ShoppingCart, Bell, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle2, Info, Loader2,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, getCountdown } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'
import { useCartStore } from '@/lib/hooks/use-cart'

// ─────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'primary-shop' | 'primary-service' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  onClick,
  type,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-shop text-white hover:brightness-95 focus-visible:ring-shop',
    'primary-shop': 'bg-shop text-white hover:brightness-95 focus-visible:ring-shop',
    'primary-service': 'bg-service text-white hover:brightness-95 focus-visible:ring-service',
    outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
  }

  const leading = loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (leftIcon ?? icon)

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      onClick={onClick}
      type={type ?? 'button'}
    >
      {leading}
      {children}
      {rightIcon && !loading && rightIcon}
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────
// IconButton
// ─────────────────────────────────────────────────────────────
interface IconButtonProps {
  icon: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'ghost' | 'outline'
  loading?: boolean
  tooltip?: string
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  'aria-label'?: string
}

export function IconButton({
  icon, size = 'md', variant = 'ghost', loading, tooltip, onClick, className, disabled, type = 'button',
  ...rest
}: IconButtonProps) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }
  const variants = {
    primary: 'bg-[#1A56DB] text-white hover:bg-[#1746C0]',
    ghost: 'text-gray-600 hover:bg-gray-100',
    outline: 'border border-gray-200 text-gray-600 hover:bg-gray-50',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      title={tooltip}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      className={cn(
        'rounded-full flex items-center justify-center transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizes[size], variants[variant], className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'gray', size = 'md', className }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  }
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs font-medium',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full', variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// OrderStatusBadge
// ─────────────────────────────────────────────────────────────
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const dotColors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-500',
    accepted: 'bg-blue-500',
    rejected: 'bg-red-500',
    preparing: 'bg-orange-500',
    ready: 'bg-purple-500',
    out_for_delivery: 'bg-indigo-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-gray-400',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      ORDER_STATUS_COLORS[status],
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[status])} />
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', centered = true }: { size?: 'sm' | 'md' | 'lg'; centered?: boolean }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  const el = <Loader2 className={cn('animate-spin text-[#1A56DB]', sizes[size])} />
  if (centered) return <div className="flex items-center justify-center p-8">{el}</div>
  return el
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-card">
      <div className="skeleton aspect-square w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-5 rounded w-1/3" />
      </div>
    </div>
  )
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card">
          <div className="skeleton h-12 w-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-2/3" />
            <div className="skeleton h-3 rounded w-1/2" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// PageHeader
// ─────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  onBack?: () => void
  right?: React.ReactNode
  className?: string
  theme?: 'shop' | 'service'
}

export function PageHeader({ title, onBack, right, className, theme }: PageHeaderProps) {
  const accentBg =
    theme === 'shop' ? 'bg-shop' : theme === 'service' ? 'bg-service' : undefined
  return (
    <div className={cn(
      'sticky top-0 z-40 flex items-center h-14 px-4 gap-3 bg-white border-b border-gray-50 relative',
      className,
    )}>
      {onBack && (
        <IconButton
          icon={<ChevronLeft className="h-5 w-5" />}
          onClick={onBack}
          aria-label="Go back"
        />
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900 truncate">{title}</h1>
      {right}
      {accentBg && <span className={cn('absolute bottom-0 left-0 h-0.5 w-full', accentBg)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SectionHeader
// ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3 px-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {href && (
        <Link href={href} className="text-sm text-[#1A56DB] font-medium flex items-center gap-0.5">
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-gray-100 my-4" />
  return (
    <div className="relative my-4">
      <hr className="border-gray-100" />
      <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-xs text-gray-400">
        {label}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PriceDisplay
// ─────────────────────────────────────────────────────────────
interface PriceDisplayProps {
  selling: number
  mrp?: number
  size?: 'sm' | 'md' | 'lg'
}

export function PriceDisplay({ selling, mrp, size = 'md' }: PriceDisplayProps) {
  const discount = mrp && mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0
  const sellingSize = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }[size]
  const mrpSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size]

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={cn('font-bold text-gray-900', sellingSize)}>
        ₹{selling.toLocaleString('en-IN')}
      </span>
      {mrp && mrp > selling && (
        <>
          <span className={cn('line-through text-gray-400', mrpSize)}>
            ₹{mrp.toLocaleString('en-IN')}
          </span>
          {discount > 0 && (
            <span className="text-xs font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
              {discount}% off
            </span>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// StockBadge
// ─────────────────────────────────────────────────────────────
export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        Out of Stock
      </span>
    )
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse-soft">
        Only {stock} left!
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      In Stock
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// RatingStars
// ─────────────────────────────────────────────────────────────
export function RatingStars({
  rating, count, size = 'sm',
}: { rating: number; count?: number; size?: 'sm' | 'md' }) {
  const stars = Math.round(rating * 2) / 2
  const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn(
              starSize,
              stars >= s ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200',
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className={cn('text-gray-500', size === 'sm' ? 'text-xs' : 'text-sm')}>
          ({count})
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CountdownTimer
// ─────────────────────────────────────────────────────────────
export function CountdownTimer({ endsAt, className }: { endsAt: string; className?: string }) {
  const [time, setTime] = useState(() => getCountdown(endsAt))

  useEffect(() => {
    const interval = setInterval(() => setTime(getCountdown(endsAt)), 1000)
    return () => clearInterval(interval)
  }, [endsAt])

  if (time.expired) {
    return <span className={cn('text-xs font-mono text-gray-400', className)}>Ended</span>
  }

  const urgency =
    time.hours === 0 && time.minutes < 15
      ? 'text-red-600'
      : time.hours === 0
      ? 'text-amber-600'
      : 'text-green-700'

  return (
    <span className={cn('text-xs font-mono font-semibold', urgency, className)}>
      {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// FloatingCartPill
// ─────────────────────────────────────────────────────────────
export function FloatingCartPill() {
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const count = mounted ? items.length : 0
  const total = mounted ? totalPrice() : 0

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        >
          <Link href="/cart">
            <div className="flex items-center gap-3 bg-[#1A56DB] text-white px-5 py-3 rounded-full shadow-floating">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-semibold bg-white/20 rounded-full px-1.5 py-0.5">
                  {count} item{count > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-sm font-bold">₹{total.toLocaleString('en-IN')}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────────
// KPICard
// ─────────────────────────────────────────────────────────────
interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: { value: number }
  className?: string
  iconBg?: string
}

export function KPICard({ icon, label, value, trend, className, iconBg = 'bg-blue-50 text-[#1A56DB]' }: KPICardProps) {
  return (
    <div className={cn('bg-white rounded-2xl p-4 shadow-card', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            trend.value >= 0 ? 'text-green-600' : 'text-red-500',
          )}>
            {trend.value >= 0
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AlertBanner
// ─────────────────────────────────────────────────────────────
interface AlertBannerProps {
  type?: 'info' | 'warning' | 'error' | 'success'
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
}

export function AlertBanner({ type = 'info', title, message, dismissible, onDismiss }: AlertBannerProps) {
  const [visible, setVisible] = useState(true)

  const styles = {
    info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', Icon: Info },
    warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', Icon: AlertTriangle },
    error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', Icon: AlertTriangle },
    success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', Icon: CheckCircle2 },
  }[type]

  const handle = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={cn('flex items-start gap-3 p-4 rounded-xl border', styles.bg)}
        >
          <styles.Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', styles.text)} />
          <div className="flex-1 min-w-0">
            {title && <p className={cn('text-sm font-semibold mb-0.5', styles.text)}>{title}</p>}
            <p className={cn('text-sm', styles.text)}>{message}</p>
          </div>
          {dismissible && (
            <button onClick={handle} className={cn('flex-shrink-0', styles.text)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────────
// ConfirmDialog
// ─────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 shadow-modal w-[90vw] max-w-sm animate-scale-in">
          <AlertDialogPrimitive.Title className="text-base font-semibold text-gray-900 mb-2">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="text-sm text-gray-600 mb-6">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="flex gap-3">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline" fullWidth onClick={onClose}>{cancelLabel}</Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                fullWidth
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'bg-white rounded-2xl shadow-modal w-[95vw] animate-scale-in overflow-hidden',
            widths[size],
          )}
          aria-describedby={undefined}
        >
          {title && (
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <DialogPrimitive.Title className="text-base font-semibold text-gray-900">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <IconButton icon={<X className="h-4 w-4" />} size="sm" aria-label="Close" />
              </DialogPrimitive.Close>
            </div>
          )}
          <div className="max-h-[80vh] overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
interface TabItem {
  value: string
  label: string
  badge?: number
}

interface TabsProps {
  items: TabItem[]
  value: string
  onValueChange: (v: string) => void
  className?: string
}

export function Tabs({ items, value, onValueChange, className }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List
        className={cn(
          'flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide',
          className,
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
              'data-[state=active]:bg-white data-[state=active]:text-[#1A56DB] data-[state=active]:shadow-sm',
              'data-[state=inactive]:text-gray-600',
            )}
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  )
}

// ─────────────────────────────────────────────────────────────
// SearchInput
// ─────────────────────────────────────────────────────────────
interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  onClear?: () => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SearchInput({
  value, onChange, onClear, placeholder = 'Search products...', autoFocus, className,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#1A56DB]/20 transition-all placeholder:text-gray-400"
        aria-label={placeholder}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { onChange(''); onClear?.(); }}
            className="absolute right-3 p-0.5 rounded-full text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ProgressBar
// ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number
  color?: string
  label?: string
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, color = 'bg-[#1A56DB]', label, showLabel = false, className }: ProgressBarProps) {
  return (
    <div className={className}>
      {(label || showLabel) && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          {label && <span>{label}</span>}
          {showLabel && <span>{Math.round(value)}%</span>}
        </div>
      )}
      <ProgressPrimitive.Root className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <ProgressPrimitive.Indicator
          className={cn('h-full transition-all duration-500 ease-out rounded-full', color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DeliveryTimeBadge
// ─────────────────────────────────────────────────────────────
export function DeliveryTimeBadge({ type }: { type: 'express' | 'same-day' | 'scheduled' }) {
  const config = {
    express: { label: '⚡ Express 2hr', className: 'bg-amber-50 text-amber-700 border-amber-100' },
    'same-day': { label: '📅 Same Day', className: 'bg-blue-50 text-blue-700 border-blue-100' },
    scheduled: { label: '🗓️ Scheduled', className: 'bg-gray-50 text-gray-600 border-gray-100' },
  }[type]

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// VendorCard
// ─────────────────────────────────────────────────────────────
interface VendorCardProps {
  id: string
  shopName: string
  categoryName?: string
  rating: number
  isActive: boolean
  logoUrl?: string | null
  className?: string
}

export function VendorCard({ id, shopName, categoryName, rating, isActive, logoUrl, className }: VendorCardProps) {
  return (
    <Link href={`/vendors/${id}`} className={cn('block', className)}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-2xl shadow-card p-4 w-44 flex-shrink-0"
      >
        <div className="h-16 w-16 rounded-2xl bg-[#DBEAFE] flex items-center justify-center mb-3 mx-auto overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={shopName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-[#1A56DB]">
              {shopName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 text-center truncate">{shopName}</p>
        {categoryName && (
          <p className="text-xs text-gray-500 text-center truncate mt-0.5">{categoryName}</p>
        )}
        <div className="flex items-center justify-center gap-1 mt-2">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
        </div>
        {isActive && (
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-green-600 font-medium">Open</span>
          </div>
        )}
      </motion.div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// NotificationBell
// ─────────────────────────────────────────────────────────────
export function NotificationBell({ className }: { className?: string }) {
  const [unread, setUnread] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase
          .from('notification_log')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('read_at', null)
          .then(({ count }) => setUnread(count ?? 0))
      })
    })
  }, [])

  return (
    <Link
      href="/notifications"
      className={cn('relative p-2 rounded-full hover:bg-gray-100 transition-colors', className)}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-gray-700" />
      <AnimatePresence>
        {mounted && unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// Legacy ToastProvider + Toast (kept for backward compat)
// ─────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Toast() {
  return null
}

// ═════════════════════════════════════════════════════════════
// v3 — Services + Enterprise components
// ═════════════════════════════════════════════════════════════
export { StepWizard, type WizardStep } from './step-wizard'
export { DataTable, type DataTableColumn } from './data-table'
export { ChartWrapper } from './chart-wrapper'
export { BookingStatusBadge } from './booking-status-badge'
export { ProviderCard } from './provider-card'
export { UpsellWidget } from './upsell-widget'
export { ServiceCategoryCard } from './service-category-card'
export { CampaignPreview } from './campaign-preview'
export { BilingualField, BilingualText } from './bilingual-field'
export { DateRangePicker } from './date-range-picker'
export { SegmentBuilder } from './segment-builder'
