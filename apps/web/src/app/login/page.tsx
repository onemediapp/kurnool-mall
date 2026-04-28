'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Phone, ArrowRight, RefreshCw } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Button } from '@/components/shared'
import { isValidIndianPhone, formatPhone } from '@kurnool-mall/shared-utils'

type Step = 'phone' | 'otp'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/'

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const supabase = createClient()

  async function sendOtp() {
    setPhoneError('')

    if (!isValidIndianPhone(phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number')
      return
    }

    setLoading(true)
    try {
      const formattedPhone = formatPhone(phone)
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (error) {
        setPhoneError(error.message)
      } else {
        setStep('otp')
        startResendCooldown()
      }
    } catch {
      setPhoneError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setOtpError('')

    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      const formattedPhone = formatPhone(phone)
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      })

      if (error) {
        setOtpError(error.message)
        return
      }

      if (data.user) {
        // Upsert into public.users (trigger also handles this, but we ensure name/email if available)
        await supabase.from('users').upsert(
          {
            id: data.user.id,
            phone: formattedPhone,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )

        router.push(redirectPath)
        router.refresh()
      }
    } catch {
      setOtpError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function startResendCooldown() {
    setResendCooldown(30)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function resendOtp() {
    if (resendCooldown > 0) return
    setOtpError('')
    setOtp('')
    setLoading(true)
    try {
      const formattedPhone = formatPhone(phone)
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone })
      if (error) {
        setOtpError(error.message)
      } else {
        startResendCooldown()
      }
    } catch {
      setOtpError('Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-shop to-shop-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Top accent bar */}
        <div className="h-1.5 w-full hero-gradient" />

        {/* Header */}
        <div className="hero-gradient p-8 text-white text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-shop" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kurnool Mall</h1>
          <p className="text-shop-light/90 text-sm mt-1 font-medium">Shop local, delivered fast</p>
        </div>

        <div className="p-6">
          {step === 'phone' ? (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Enter your mobile number</h2>
              <p className="text-sm text-gray-500 mb-5">We&apos;ll send you a one-time password</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="flex items-center border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-shop/30 focus-within:border-shop transition-all">
                  <div className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 h-14 shrink-0">
                    <span className="text-base">🇮🇳</span>
                    <span className="text-sm font-semibold text-gray-700">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                      setPhoneError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                    placeholder="9876543210"
                    maxLength={10}
                    inputMode="numeric"
                    className="flex-1 px-3 h-14 text-base outline-none bg-transparent"
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {phoneError}
                  </p>
                )}
              </div>

              <Button
                size="lg"
                loading={loading}
                onClick={sendOtp}
                className="mt-2"
              >
                Send OTP <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <p className="text-center text-xs text-gray-500">
                <Phone className="inline h-3 w-3 mr-1" />
                Want to sell on Kurnool Mall?{' '}
                <a href="tel:+919000000000" className="text-shop font-medium">
                  Contact us
                </a>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('phone'); setOtp(''); setOtpError('') }}
                className="text-sm text-shop mb-4 hover:underline flex items-center gap-1"
              >
                ← Change number
              </button>

              <h2 className="text-lg font-semibold text-gray-800 mb-1">Enter OTP</h2>
              <p className="text-sm text-gray-500 mb-5">
                Sent to +91 {phone}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  6-digit OTP
                </label>
                <input
                  type="tel"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setOtpError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                  placeholder="• • • • • •"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  className="w-full border border-gray-200 rounded-2xl px-4 h-16 text-2xl font-bold tracking-[0.6em] text-center outline-none focus:ring-2 focus:ring-shop/30 focus:border-shop transition-all"
                />
                {otpError && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {otpError}
                  </p>
                )}
              </div>

              <Button
                size="lg"
                loading={loading}
                onClick={verifyOtp}
                className="mt-2"
              >
                Verify &amp; Login
              </Button>

              <div className="text-center mt-4">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-gray-400">
                    <RefreshCw className="inline h-3 w-3 mr-1" />
                    Resend OTP in {resendCooldown}s
                  </p>
                ) : (
                  <button
                    onClick={resendOtp}
                    className="text-sm text-shop hover:underline font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-shop to-shop-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
