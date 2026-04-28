'use client'

import Link from 'next/link'
import { formatPrice, cn } from '@kurnool-mall/shared-utils'

interface ServiceCategoryCardProps {
  slug: string
  nameEn: string
  nameTe?: string
  emoji: string
  basePrice: number
  href?: string
  className?: string
}

export function ServiceCategoryCard({
  slug, nameEn, nameTe, emoji, basePrice, href, className,
}: ServiceCategoryCardProps) {
  const body = (
    <div
      className={cn(
        'flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-service/30 transition-all',
        className,
      )}
    >
      <div className="h-14 w-14 rounded-full bg-service-light flex items-center justify-center text-3xl mb-2">
        {emoji}
      </div>
      <p className="text-sm font-semibold text-gray-900 leading-tight">{nameEn}</p>
      {nameTe && <p className="text-[11px] text-gray-500 font-telugu leading-tight mt-0.5">{nameTe}</p>}
      {basePrice > 0 && (
        <p className="text-xs text-service font-medium mt-1.5">
          From {formatPrice(basePrice)}
        </p>
      )}
    </div>
  )

  return href ? (
    <Link href={href} aria-label={nameEn} data-slug={slug}>{body}</Link>
  ) : body
}
