'use client'

import { SectionHeader } from '@/components/shared'
import Link from 'next/link'
import { Wrench, Home, Zap, Droplets, Truck, Scissors, Lightbulb, Hammer } from 'lucide-react'

const serviceCategories = [
  {
    id: 1,
    name: 'Electrical',
    emoji: '⚡',
    icon: Lightbulb,
    description: 'Repairs & Installation',
    href: '/services/electrical'
  },
  {
    id: 2,
    name: 'Plumbing',
    emoji: '💧',
    icon: Droplets,
    description: 'Leaks & Repairs',
    href: '/services/plumbing'
  },
  {
    id: 3,
    name: 'Home Cleaning',
    emoji: '🧹',
    icon: Home,
    description: 'Deep & Regular Cleaning',
    href: '/services/cleaning'
  },
  {
    id: 4,
    name: 'Carpentry',
    emoji: '🪛',
    icon: Hammer,
    description: 'Furniture & Repairs',
    href: '/services/carpentry'
  },
  {
    id: 5,
    name: 'Salon & Spa',
    emoji: '💅',
    icon: Scissors,
    description: 'Hair & Beauty',
    href: '/services/salon'
  },
  {
    id: 6,
    name: 'AC & Appliances',
    emoji: '❄️',
    icon: Zap,
    description: 'Repair & Servicing',
    href: '/services/appliances'
  },
]

const topProviders = [
  {
    id: 1,
    name: 'Sharma Electricals',
    rating: 4.8,
    reviews: 342,
    category: 'Electrical',
    image: '⚡'
  },
  {
    id: 2,
    name: 'Quick Plumbing Solutions',
    rating: 4.7,
    reviews: 258,
    category: 'Plumbing',
    image: '💧'
  },
  {
    id: 3,
    name: 'Shine Clean Services',
    rating: 4.9,
    reviews: 412,
    category: 'Cleaning',
    image: '🧹'
  },
  {
    id: 4,
    name: 'Expert Carpentry Works',
    rating: 4.6,
    reviews: 195,
    category: 'Carpentry',
    image: '🪛'
  },
]

export default function ServicesHomeContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Booking Promise Strip ─── */}
      <div className="flex items-center justify-center gap-5 bg-gradient-to-r from-[#7C3AED] to-[#1A56DB] px-4 py-2">
        <div className="flex items-center gap-1.5 text-white">
          <Wrench className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Book Instantly</span>
        </div>
        <div className="h-3 w-px bg-white/30" />
        <div className="flex items-center gap-1.5 text-white">
          <Truck className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Same Day Service</span>
        </div>
        <div className="h-3 w-px bg-white/30" />
        <span className="text-xs font-medium text-white">⭐ Verified Experts</span>
      </div>

      {/* ── Services Hero Banner ─── */}
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#1A56DB] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium opacity-90 mb-1">🔧 Local Experts</p>
            <h2 className="text-2xl font-extrabold leading-tight mb-2">
              Home Services<br />at Your Doorstep
            </h2>
            <p className="text-sm opacity-90">Professional & trusted service providers</p>
          </div>
          <div className="text-4xl">🔧</div>
        </div>
      </div>

      {/* ── Quick Service Categories ─── */}
      <div className="mt-5">
        <SectionHeader title="Browse Services" />
        <div className="grid grid-cols-2 gap-3 px-4">
          {serviceCategories.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="text-3xl mb-2">{service.emoji}</div>
              <h3 className="font-semibold text-sm text-gray-900 mb-0.5">
                {service.name}
              </h3>
              <p className="text-xs text-gray-500">{service.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Top Providers ─── */}
      <div className="mt-5">
        <SectionHeader title="Top Providers" />
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {topProviders.map((provider) => (
            <Link
              key={provider.id}
              href={`/services/provider/${provider.id}`}
              className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-24 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center text-4xl">
                {provider.image}
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                  {provider.name}
                </h4>
                <p className="text-xs text-gray-500 mb-2">{provider.category}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-900">⭐ {provider.rating}</span>
                  <span className="text-xs text-gray-500">({provider.reviews})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── How It Works ─── */}
      <div className="mt-5 mx-4 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">How It Works</h3>
        <div className="space-y-2">
          <div className="flex gap-3 bg-white rounded-lg p-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A56DB] text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Browse & Select</p>
              <p className="text-xs text-gray-500">Choose a service category and provider</p>
            </div>
          </div>
          <div className="flex gap-3 bg-white rounded-lg p-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A56DB] text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Book Appointment</p>
              <p className="text-xs text-gray-500">Pick your preferred date and time slot</p>
            </div>
          </div>
          <div className="flex gap-3 bg-white rounded-lg p-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A56DB] text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Expert Arrives</p>
              <p className="text-xs text-gray-500">Professional arrives on time & completes work</p>
            </div>
          </div>
          <div className="flex gap-3 bg-white rounded-lg p-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A56DB] text-white flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pay & Review</p>
              <p className="text-xs text-gray-500">Secure payment & rate your experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
