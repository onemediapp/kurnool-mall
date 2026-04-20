'use client'

import { SectionHeader } from '@/components/shared'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Wrench, Home, Zap, Droplets, Truck, Scissors, Lightbulb, Hammer, Shield, Star, ArrowRight } from 'lucide-react'

const serviceCategories = [
  { id: 1, name: 'Electrical', emoji: '⚡', icon: Lightbulb, description: 'Repairs & Fitting', tone: 'amber', href: '/services/electrical' },
  { id: 2, name: 'Plumbing', emoji: '💧', icon: Droplets, description: 'Leaks & Repairs', tone: 'sky', href: '/services/plumbing' },
  { id: 3, name: 'Home Cleaning', emoji: '🧹', icon: Home, description: 'Deep & Regular', tone: 'emerald', href: '/services/cleaning' },
  { id: 4, name: 'Carpentry', emoji: '🪛', icon: Hammer, description: 'Furniture & Fix', tone: 'orange', href: '/services/carpentry' },
  { id: 5, name: 'Salon & Spa', emoji: '💅', icon: Scissors, description: 'Hair & Beauty', tone: 'rose', href: '/services/salon' },
  { id: 6, name: 'AC & Appliances', emoji: '❄️', icon: Zap, description: 'Repair & Service', tone: 'brand', href: '/services/appliances' },
] as const

const topProviders = [
  { id: 1, name: 'Sharma Electricals', rating: 4.8, reviews: 342, category: 'Electrical', image: '⚡', tone: 'amber' },
  { id: 2, name: 'Quick Plumbing Solutions', rating: 4.7, reviews: 258, category: 'Plumbing', image: '💧', tone: 'sky' },
  { id: 3, name: 'Shine Clean Services', rating: 4.9, reviews: 412, category: 'Cleaning', image: '🧹', tone: 'emerald' },
  { id: 4, name: 'Expert Carpentry Works', rating: 4.6, reviews: 195, category: 'Carpentry', image: '🪛', tone: 'orange' },
] as const

const toneStyles: Record<string, string> = {
  amber: 'from-amber-50 to-amber-100 border-amber-100',
  sky: 'from-sky-50 to-sky-100 border-sky-100',
  emerald: 'from-emerald-50 to-emerald-100 border-emerald-100',
  orange: 'from-orange-50 to-orange-100 border-orange-100',
  rose: 'from-rose-50 to-rose-100 border-rose-100',
  brand: 'from-brand-50 to-brand-100 border-brand-100',
}

const howItWorks = [
  { step: 1, title: 'Browse & Select', description: 'Choose a service category and verified provider', icon: '🔍' },
  { step: 2, title: 'Book Appointment', description: 'Pick your preferred date and time slot', icon: '📅' },
  { step: 3, title: 'Expert Arrives', description: 'Professional arrives on time & completes the work', icon: '👨‍🔧' },
  { step: 4, title: 'Pay & Review', description: 'Secure payment & rate your experience', icon: '⭐' },
]

export default function ServicesHomeContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Booking Promise Strip ─── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}>
        <div className="relative flex items-center justify-center gap-4 px-4 py-2">
          <div className="flex items-center gap-1.5 text-white">
            <Wrench className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold">Book Instantly</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1.5 text-white">
            <Truck className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold">Same Day</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1 text-white">
            <Shield className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold">Verified Experts</span>
          </div>
        </div>
      </div>

      {/* ── Services Hero Banner ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mx-4 mt-4 relative rounded-3xl p-6 text-white overflow-hidden shadow-immersive"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #7C3AED 60%, #4F46E5 100%)' }}
      >
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-6 -bottom-10 h-36 w-36 rounded-full bg-rose-400/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-90 mb-1.5">🔧 Trusted Local Experts</p>
            <h2 className="text-[26px] font-extrabold leading-[1.1] mb-2">
              Home Services<br />at Your Doorstep
            </h2>
            <p className="text-sm opacity-90">Verified pros · Fair pricing · Same day</p>
          </div>
          <div className="text-5xl leading-none">🔧</div>
        </div>
      </motion.div>

      {/* ── Quick Service Categories (Premium cards) ─── */}
      <div className="mt-6">
        <SectionHeader title="Browse Services" />
        <div className="grid grid-cols-2 gap-3 px-4">
          {serviceCategories.map((service, idx) => (
            <Link key={service.id} href={service.href}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.97 }}
                className={`rounded-2xl bg-gradient-to-br ${toneStyles[service.tone]} p-4 border shadow-soft hover:shadow-card-hover transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-soft">
                    {service.emoji}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-0.5">
                  {service.name}
                </h3>
                <p className="text-xs text-gray-600 font-medium">{service.description}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Top Providers ─── */}
      <div className="mt-6">
        <SectionHeader title="Top Providers" href="/services" />
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {topProviders.map((provider, idx) => (
            <Link key={provider.id} href={`/services/provider/${provider.id}`}>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                className="flex-shrink-0 w-44 bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100 card-interactive"
              >
                <div className={`h-28 bg-gradient-to-br ${toneStyles[provider.tone]} flex items-center justify-center text-5xl border-b border-white/60`}>
                  {provider.image}
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight mb-1">
                    {provider.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-2 font-medium">{provider.category}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                      <span className="text-[11px] font-bold">{provider.rating}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">({provider.reviews})</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── How It Works (sleek vertical timeline) ─── */}
      <div className="mt-6 mx-4 mb-8">
        <h3 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
          <span>How It Works</span>
          <span className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
        </h3>
        <div className="relative">
          <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-brand-300 via-brand-200 to-transparent" />
          <div className="space-y-3">
            {howItWorks.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-3 items-start"
              >
                <div className="relative z-10 flex-shrink-0 h-10 w-10 rounded-full bg-gradient-brand text-white flex items-center justify-center font-extrabold text-sm shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
                  {item.step}
                </div>
                <div className="flex-1 bg-white rounded-2xl p-3.5 shadow-soft border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                    </div>
                    <span className="text-xl leading-none mt-0.5">{item.icon}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
