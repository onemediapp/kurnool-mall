import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/server'
import { OrderStatusBadge, EmptyState } from '@/components/shared'
import { formatDate, formatPrice } from '@kurnool-mall/shared-utils'
import type { Order } from '@kurnool-mall/shared-types'

export default async function OrdersPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/orders')

  const { data: ordersData } = await supabase
    .from('orders')
    .select('*, vendor:vendors(shop_name), order_items(id, product_name, quantity)')
    .eq('customer_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const orders = (ordersData ?? []) as unknown as (Order & { vendor: { shop_name: string } })[]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14">
        <h1 className="text-base font-semibold text-gray-900">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title="No orders yet"
          description="Place your first order from local vendors in Kurnool."
          action={
            <Link href="/" className="text-sm text-shop font-medium hover:underline">
              Browse Products
            </Link>
          }
        />
      ) : (
        <div className="p-4 space-y-3">
          {orders.map((order) => {
            const itemNames = order.order_items
              ?.map((i) => `${i.product_name} ×${i.quantity}`)
              .join(', ')

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-mono font-semibold text-gray-600">{order.order_number}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {order.vendor?.shop_name || 'Vendor'}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {itemNames && (
                  <p className="text-xs text-gray-500 mb-2 truncate">{itemNames}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(order.grand_total)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
