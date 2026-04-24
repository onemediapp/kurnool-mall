import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-shop-light flex items-center justify-center mb-4">
          <Compass className="h-8 w-8 text-shop" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">404</h1>
        <p className="text-sm text-gray-500 mb-6">
          We couldn&apos;t find the page you were looking for.
        </p>
        <Link
          href="/"
          className="inline-block w-full bg-shop hover:bg-shop-dark text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
