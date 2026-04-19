'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProviderCardProps {
  id: string
  businessName: string
  photoUrl?: string | null
  rating: number
  totalJobs: number
  serviceAreas?: string[]
  verified?: boolean
  href?: string
  className?: string
  action?: React.ReactNode
}

export function ProviderCard({
  id,
  businessName,
  photoUrl,
  rating,
  totalJobs,
  serviceAreas,
  verified,
  href,
  className,
  action,
}: ProviderCardProps) {
  const body = (
    <div className={cn('flex items-start gap-3 p-3 bg-white rounded-2xl border border-gray-100', className)}>
      <div className="relative h-14 w-14 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
        {photoUrl ? (
          <Image src={photoUrl} alt={businessName} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl text-gray-400">🧰</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 truncate">{businessName}</p>
          {verified && <CheckCircle2 className="h-4 w-4 text-[#1A56DB] flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            {rating.toFixed(1)}
          </span>
          <span>{totalJobs} jobs</span>
        </div>
        {serviceAreas && serviceAreas.length > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{serviceAreas.slice(0, 2).join(', ')}</span>
          </div>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )

  return href ? <Link href={href}>{body}</Link> : body
}
