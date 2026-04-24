'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Banner } from '@kurnool-mall/shared-types'

interface HomeCarouselProps {
  banners: Banner[]
}

export default function HomeCarousel({ banners }: HomeCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (paused || banners.length <= 1) return
    const interval = setInterval(next, 4000)
    return () => clearInterval(interval)
  }, [paused, banners.length, next])

  if (banners.length === 0) return null

  const banner = banners[current]

  return (
    <div
      className="relative mx-4 mt-4 rounded-2xl overflow-hidden h-48 cursor-pointer"
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Background */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: banner.bg_color || '#1E3A5F' }}
      />

      {/* Image if present */}
      {banner.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.image_url}
          alt={banner.title_en}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-5 py-4">
        <p className="text-white/70 text-xs font-medium mb-1">{banner.subtitle_en}</p>
        <h2 className="text-white text-xl font-extrabold leading-tight mb-3">
          {banner.title_en}
        </h2>
        {banner.cta_text_en && (
          <span className="inline-flex items-center bg-white text-[#1A56DB] text-xs font-semibold px-3 py-1.5 rounded-full w-fit">
            {banner.cta_text_en} →
          </span>
        )}
      </div>

      {/* Dot pagination */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-300 rounded-full h-1.5"
              style={{
                width: i === current ? 20 : 6,
                background: i === current ? 'white' : 'rgba(255,255,255,0.4)',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
