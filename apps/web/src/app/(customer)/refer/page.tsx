'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Share2, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/shared'
import type { User } from '@/lib/types'

const HOW_IT_WORKS = [
  { step: '1', icon: '📤', title: 'Share your code', desc: 'Send your unique referral code to friends' },
  { step: '2', icon: '🛒', title: 'Friend places an order', desc: 'They get ₹50 off their first order' },
  { step: '3', icon: '🎁', title: 'You earn ₹50', desc: 'Credited as loyalty points after delivery' },
]

export default function ReferPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) { setLoading(false); return }
      supabase.from('users').select('*').eq('id', authUser.id).single()
        .then(({ data }) => {
          if (data) setUser(data as User)
          setLoading(false)
        })
    })
  }, [])

  const referralCode = user ? `KM${user.phone?.slice(-4) ?? '0000'}`.toUpperCase() : '—'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  function handleWhatsAppShare() {
    const text = `🛍️ Shop local in Kurnool with Kurnool Mall!\n\nUse my referral code *${referralCode}* and get ₹50 off your first order! 🎁\n\nDownload & shop now: kurnoolmall.in`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14 gap-3">
        <Link href="/account" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900">Refer &amp; Earn</h1>
      </div>

      {/* Hero */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #1A56DB 100%)' }}>
        <div className="p-6 text-white text-center">
          <div className="text-5xl mb-3">🎁</div>
          <h2 className="text-xl font-extrabold mb-1">Earn ₹50 per referral!</h2>
          <p className="text-sm text-white/70">Share your code. Friends save too.</p>
        </div>
      </div>

      {/* Referral code */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-card text-center">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Your Referral Code</p>
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-3xl font-extrabold text-gray-900 font-mono tracking-widest">{referralCode}</span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              copied ? 'bg-green-100 text-green-700' : 'bg-[#DBEAFE] text-[#1A56DB]'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          onClick={handleWhatsAppShare}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-semibold text-sm"
        >
          <Share2 className="h-4 w-4" />
          Share on WhatsApp
        </button>
      </div>

      {/* Stats */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-card text-center">
          <p className="text-2xl font-extrabold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-0.5">Friends Referred</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card text-center">
          <p className="text-2xl font-extrabold text-[#1A56DB]">₹0</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Earned</p>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="h-4 w-4 text-[#1A56DB]" /> How it Works
        </h2>
        <div className="space-y-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className="w-9 h-9 bg-[#DBEAFE] rounded-xl flex items-center justify-center text-xl shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 px-8 mt-4">
        * Earnings are credited as loyalty points after the referred friend&apos;s first order is delivered.
      </p>
    </div>
  )
}
