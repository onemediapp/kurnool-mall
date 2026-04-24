'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Spinner, Tabs, EmptyState, Button, Badge } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatDate } from '@kurnool-mall/shared-utils'
import type { NotificationLogEntry } from '@kurnool-mall/shared-types'

type Filter = 'all' | 'order' | 'booking' | 'promo' | 'system'

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('notification_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (filter !== 'all') q = q.eq('type', filter)
    const { data } = await q
    setNotifs((data ?? []) as NotificationLogEntry[])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function markAllRead() {
    const supabase = createClient()
    const { error } = await supabase
      .from('notification_log')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
    if (error) { toast.error(error.message); return }
    toast.success('All marked as read')
    load()
  }

  const unreadCount = notifs.filter((n) => !n.read_at).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>Mark all read</Button>
          <Link href="/admin/marketing/campaigns/new">
            <Button variant="primary">Broadcast</Button>
          </Link>
        </div>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        items={[
          { value: 'all', label: 'All' },
          { value: 'order', label: 'Orders' },
          { value: 'booking', label: 'Bookings' },
          { value: 'promo', label: 'Promos' },
          { value: 'system', label: 'System' },
        ]}
      />

      <div className="mt-4">
        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : notifs.length === 0 ? (
          <EmptyState title="No notifications" description="Notifications from orders, bookings, and campaigns will appear here." />
        ) : (
          <ul className="space-y-2">
            {notifs.map((n) => (
              <li
                key={n.id}
                className={`bg-white rounded-xl border p-4 ${n.read_at ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <Badge variant={
                        n.type === 'order' ? 'blue' :
                        n.type === 'booking' ? 'green' :
                        n.type === 'promo' ? 'purple' : 'gray'
                      }>{n.type}</Badge>
                      <Badge variant="gray">{n.channel}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.read_at && (
                    <span className="h-2 w-2 rounded-full bg-[#1A56DB] flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
