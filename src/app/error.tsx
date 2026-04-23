'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-danger-light flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          We hit an unexpected error. You can try again or head back home.
        </p>
        {error.digest && (
          <p className="text-[11px] text-gray-400 font-mono mb-4">
            Ref: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="w-full bg-shop hover:bg-shop-dark text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
          >
            Go to home
          </Link>
        </div>
      </div>
    </div>
  )
}
