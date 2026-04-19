'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ServicesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const providers = [
    { id: '1', name: 'Sharma Electricals', category: 'Electrical', rating: 4.8, reviews: 342, icon: '⚡', available: 'today' },
    { id: '2', name: 'Quick Plumbing', category: 'Plumbing', rating: 4.7, reviews: 258, icon: '💧', available: 'today' },
    { id: '3', name: 'Shine Clean Services', category: 'Cleaning', rating: 4.9, reviews: 412, icon: '🧹', available: 'tomorrow' },
    { id: '4', name: 'Expert Carpentry', category: 'Carpentry', rating: 4.6, reviews: 195, icon: '🪛', available: 'today' },
    { id: '5', name: 'Premium Beauty Studio', category: 'Salon & Spa', rating: 4.7, reviews: 289, icon: '💅', available: 'today' },
    { id: '6', name: 'AC Masters Service', category: 'AC & Appliances', rating: 4.8, reviews: 356, icon: '❄️', available: 'today' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="flex-shrink-0">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">All Services</h1>
            <p className="text-xs text-gray-500">{providers.length} providers</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {providers.map((provider) => (
            <Link
              key={provider.id}
              href={`/services/provider/${provider.id}`}
              className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="flex gap-4 p-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center text-3xl flex-shrink-0">
                  {provider.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{provider.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{provider.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">⭐ {provider.rating}</span>
                    <span className="text-xs text-green-600">✓ Available {provider.available}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
