'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Package, Tag, Star, Gift, Megaphone } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Spinner, EmptyState } from '@/components/shared'
import { timeAgo } from '@kurnool-mall/shared-utils'
import type { Notification } from '@kurnool-mall/shared-types'

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  order: { icon: Package, color: 'bg-blue-50 text-shop' },
  promo: { icon: Tag, color: 'bg-amber-50 text-amber-500' },
  review: { icon: Star, color: 'bg-yellow-50 text-yellow-500' },
  loyalty: { icon: Gift, color: 'bg-purple-50 text-purple-600' },
  system: { icon: Megaphone, color: 'bg-gray-100 text-gray-600' },
}

function groupByDate(notifications: Notification[]) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups: { label: string; items: Notification[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ]

  for (const notif of notifications) {
    const d = new Date(notif.created_at)
    if (d.toDateString() === today.toDateString()) {
      groups[0].items.push(notif)
    } else if (d.toDateString() === yesterday.toDateString()) {
      groups[1].items.push(notif)
    } else {
      groups[2].items.push(notif)
    }
  }

  return groups.filter((g) => g.items.length > 0)
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifications((data ?? []) as Notification[])

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const groups = groupByDate(notifications)

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14 gap-3">
        <Link href="/account" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="h-4 w-4 text-shop" />
          Notifications
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications"
          description="You're all caught up! Check back later for updates on your orders and offers."
        />
      ) : (
        <div className="py-4 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {group.label}
              </p>
              <div className="bg-white mx-4 rounded-2xl shadow-card overflow-hidden divide-y divide-gray-50">
                {group.items.map((notif) => {
                  const typeInfo = TYPE_ICONS[notif.type] ?? TYPE_ICONS.system
                  const Icon = typeInfo.icon
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-4 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{notif.title}</p>
                        {notif.body && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{notif.body}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-shop rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
