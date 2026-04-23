'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, MapPin, ClipboardList, LogOut, ChevronRight, Globe, Heart, Bell, Gift, HelpCircle, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Spinner } from '@/components/shared'
import { getLoyaltyTier, TIER_CONFIG } from '@/lib/utils'
import type { User as UserType, LoyaltyAccount } from '@/lib/types'

const QUICK_LINKS = [
  { icon: ClipboardList, label: 'My Orders', href: '/orders', color: 'bg-blue-50 text-[#1A56DB]' },
  { icon: Heart, label: 'Wishlist', href: '/wishlist', color: 'bg-pink-50 text-pink-500' },
  { icon: MapPin, label: 'Addresses', href: '/account/addresses', color: 'bg-green-50 text-green-600' },
  { icon: Gift, label: 'Refer & Earn', href: '/refer', color: 'bg-amber-50 text-amber-500' },
  { icon: Bell, label: 'Notifications', href: '/notifications', color: 'bg-purple-50 text-purple-600' },
  { icon: HelpCircle, label: 'Help', href: '/help', color: 'bg-gray-100 text-gray-600' },
]

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [langSaving, setLangSaving] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login?redirect=/account')
        return
      }
      const [profileRes, loyaltyRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase.from('loyalty_accounts').select('*').eq('user_id', authUser.id).maybeSingle(),
      ])
      if (profileRes.data) setUser(profileRes.data as UserType)
      if (loyaltyRes.data) setLoyalty(loyaltyRes.data as LoyaltyAccount)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function toggleLanguage() {
    if (!user) return
    const newLang = user.language_pref === 'en' ? 'te' : 'en'
    setLangSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('users').update({ language_pref: newLang }).eq('id', user.id)
      setUser({ ...user, language_pref: newLang })
    } catch {
      // ignore
    } finally {
      setLangSaving(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) return null

  const tier = loyalty ? getLoyaltyTier(loyalty.points_balance) : 'bronze'
  const tierConfig = TIER_CONFIG[tier]
  const nextTierPoints = tier === 'bronze' ? 500 : tier === 'silver' ? 2000 : tier === 'gold' ? 5000 : null
  const pct = loyalty && nextTierPoints
    ? Math.min((loyalty.points_balance / nextTierPoints) * 100, 100)
    : 100

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14">
        <h1 className="text-base font-semibold text-gray-900">Account</h1>
      </div>

      {/* User card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-card flex items-center gap-3">
        <div className="w-14 h-14 bg-[#DBEAFE] rounded-full flex items-center justify-center">
          <User className="h-7 w-7 text-[#1A56DB]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{user.name || 'User'}</p>
          <p className="text-sm text-gray-500">{user.phone}</p>
          {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
        </div>
        <Link href="/account/settings" className="p-2 rounded-full hover:bg-gray-100">
          <Settings className="h-4 w-4 text-gray-400" />
        </Link>
      </div>

      {/* Loyalty card */}
      <div
        className="mx-4 mt-3 rounded-2xl p-4 shadow-card"
        style={{ background: `linear-gradient(135deg, ${tierConfig.color} 0%, ${tierConfig.color}88 100%)` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/70 text-xs font-medium">Your Tier</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl">{tierConfig.icon}</span>
              <span className="text-white font-bold text-base">{tierConfig.label}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs font-medium">Points Balance</p>
            <p className="text-white font-extrabold text-2xl">{loyalty?.points_balance ?? 0}</p>
          </div>
        </div>
        {nextTierPoints && (
          <div>
            <div className="flex justify-between text-[10px] text-white/70 mb-1">
              <span>{loyalty?.points_balance ?? 0} pts</span>
              <span>{nextTierPoints} pts to next tier</span>
            </div>
            <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {!nextTierPoints && (
          <p className="text-white/80 text-xs font-medium">🏆 Maximum tier reached!</p>
        )}
      </div>

      {/* Quick links grid */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-2xl p-3 shadow-card flex flex-col items-center gap-2 hover:shadow-card-hover transition-shadow active:scale-95"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${link.color}`}>
              <link.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Language toggle */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Language</p>
              <p className="text-xs text-gray-400">
                {user.language_pref === 'en' ? 'English' : 'తెలుగు'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleLanguage}
            disabled={langSaving}
            className="flex items-center gap-0.5 bg-gray-100 rounded-lg overflow-hidden"
          >
            <span className={`px-3 py-1.5 text-xs font-semibold transition-colors ${user.language_pref === 'en' ? 'bg-[#1A56DB] text-white' : 'text-gray-500 hover:bg-gray-200'}`}>
              EN
            </span>
            <span className={`px-3 py-1.5 text-xs font-semibold transition-colors font-telugu ${user.language_pref === 'te' ? 'bg-[#1A56DB] text-white' : 'text-gray-500 hover:bg-gray-200'}`}>
              తెలుగు
            </span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="mx-4 mt-3">
        <Button variant="danger" size="lg" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <p className="text-center text-xs text-gray-300 mt-6 pb-6">
        Kurnool Mall v2.0 • Made in Kurnool 🏙️
      </p>
    </div>
  )
}
