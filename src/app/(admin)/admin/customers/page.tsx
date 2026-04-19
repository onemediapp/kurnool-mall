'use client'

import { useEffect, useState } from 'react'
import { Search, X, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/shared'
import { formatDate, formatPrice } from '@/lib/utils'

interface Customer {
  id: string
  name: string | null
  phone: string
  email: string | null
  created_at: string
  is_blocked: boolean
  order_count?: number
  total_spend?: number
  last_order_at?: string | null
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Customer | null>(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('id, name, phone, email, created_at, is_blocked')
      .order('created_at', { ascending: false })
    setCustomers((data ?? []) as Customer[])
    setLoading(false)
  }

  async function toggleBlock(customerId: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('users').update({ is_blocked: !current }).eq('id', customerId)
    setCustomers((prev) => prev.map((c) => c.id === customerId ? { ...c, is_blocked: !current } : c))
    if (selected?.id === customerId) setSelected((s) => s ? { ...s, is_blocked: !current } : s)
  }

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (c.name?.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q))
  })

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <span className="text-xs text-gray-500">{filtered.length} customers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Registered</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name || 'Unknown'}</p>
                          {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{customer.phone}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(customer.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${customer.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {customer.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelected(customer)}
                        className="text-xs text-[#1A56DB] font-medium hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-8">No customers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Customer Detail</h3>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-[#DBEAFE] rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="h-8 w-8 text-[#1A56DB]" />
              </div>
              <p className="font-semibold text-gray-900">{selected.name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">{selected.phone}</p>
              {selected.email && <p className="text-xs text-gray-400">{selected.email}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Registered</span>
                <span className="font-medium text-gray-900">{formatDate(selected.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${selected.is_blocked ? 'text-red-600' : 'text-green-600'}`}>
                  {selected.is_blocked ? 'Blocked' : 'Active'}
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleBlock(selected.id, selected.is_blocked)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold ${selected.is_blocked ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
            >
              {selected.is_blocked ? 'Unblock Customer' : 'Block Customer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
