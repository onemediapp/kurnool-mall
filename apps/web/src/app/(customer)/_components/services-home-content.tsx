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
      <div className="flex items-center justify-center gap-5 service-gradient px-4 py-2">
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
      <div className="mx-4 mt-4 rounded-2xl service-gradient p-6 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 text-white/10">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" />
          </svg>
        </div>
        <div className="absolute -bottom-2 right-4 text-7xl opacity-20 transform rotate-12">🔧</div>
        <div className="absolute top-8 right-20 text-3xl opacity-20 transform -rotate-12">✨</div>
        <div className="absolute bottom-10 right-24 text-2xl opacity-20">⚡</div>
        <div className="relative z-10">
          <p className="text-xs font-medium text-white/90 mb-1 tracking-wider uppercase">🔧 Local Experts</p>
          <h2 className="text-2xl font-extrabold leading-tight mb-2">
            Home Services<br />at Your Doorstep
          </h2>
          <p className="text-sm text-white/90">Professional & trusted service providers</p>
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
              className="group rounded-xl bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col"
            >
              <div className="h-12 w-12 rounded-full bg-service-light flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                {service.emoji}
              </div>
              <h3 className="font-semibold text-sm text-gray-900 mb-0.5 group-hover:text-service transition-colors">
                {service.name}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-1">{service.description}</p>
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
              className="flex-shrink-0 w-44 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="relative h-28 bg-service-light flex items-center justify-center text-5xl group-hover:bg-service-muted transition-colors">
                {provider.image}
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-900">⭐ {provider.rating}</span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-0.5 group-hover:text-service transition-colors">
                  {provider.name}
                </h4>
                <p className="text-xs text-gray-500 mb-2">{provider.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">{provider.reviews} reviews</span>
                  <span className="text-[10px] font-semibold text-service bg-service-light px-2 py-0.5 rounded-full">
                    View
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── How It Works ─── */}
      <div className="mt-5 mx-4 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">How It Works</h3>
        <div className="space-y-3">
          <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-service text-white flex items-center justify-center font-bold text-sm shadow-sm">
              1
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Browse & Select</p>
              <p className="text-xs text-gray-500">Choose a service category and provider</p>
            </div>
          </div>
          <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-service text-white flex items-center justify-center font-bold text-sm shadow-sm">
              2
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Book Appointment</p>
              <p className="text-xs text-gray-500">Pick your preferred date and time slot</p>
            </div>
          </div>
          <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-service text-white flex items-center justify-center font-bold text-sm shadow-sm">
              3
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Expert Arrives</p>
              <p className="text-xs text-gray-500">Professional arrives on time & completes work</p>
            </div>
          </div>
          <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-service text-white flex items-center justify-center font-bold text-sm shadow-sm">
              4
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Pay & Review</p>
              <p className="text-xs text-gray-500">Secure payment & rate your experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
