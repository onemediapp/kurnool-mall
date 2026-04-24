'use client'

import Link from 'next/link'
import {
  ShoppingCart, Wrench, Users, UserCheck, Package, Award,
} from 'lucide-react'

const REPORTS = [
  { slug: 'sales', label: 'Sales Report', desc: 'Product orders, revenue, and GMV over time.', icon: ShoppingCart },
  { slug: 'services', label: 'Services Report', desc: 'Service bookings, revenue, and commission.', icon: Wrench },
  { slug: 'providers', label: 'Providers Report', desc: 'Provider performance, ratings, and jobs.', icon: UserCheck },
  { slug: 'customers', label: 'Customers Report', desc: 'Signups, retention, and lifetime value.', icon: Users },
  { slug: 'inventory', label: 'Inventory Report', desc: 'Stock levels, low-stock alerts, and turnover.', icon: Package },
  { slug: 'loyalty', label: 'Loyalty Report', desc: 'Tier distribution, points earned/redeemed.', icon: Award },
]

export default function ReportsIndexPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
      <p className="text-sm text-gray-500 mb-5">Pre-built business reports with PDF &amp; CSV export.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REPORTS.map((r) => {
          const Icon = r.icon
          return (
            <Link
              key={r.slug}
              href={`/admin/reports/${r.slug}`}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
            >
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
