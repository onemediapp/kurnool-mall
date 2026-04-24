'use client'

import React, { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { cn } from '@kurnool-mall/shared-utils'

interface ChartWrapperProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  exportFilename?: string
  action?: React.ReactNode
  className?: string
}

// Thin card around a Recharts chart with an optional PNG export button.
// The export path dynamically imports html2canvas so we never ship it in SSR.
export function ChartWrapper({
  title, subtitle, children, exportFilename, action, className,
}: ChartWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  async function exportPng() {
    if (!ref.current) return
    setBusy(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `${exportFilename ?? 'chart'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-5', className)}>
      {(title || subtitle || exportFilename || action) && (
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            {exportFilename && (
              <button
                type="button"
                onClick={exportPng}
                disabled={busy}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
                aria-label="Export chart as PNG"
              >
                <Download className="h-3.5 w-3.5" />
                PNG
              </button>
            )}
          </div>
        </div>
      )}
      <div ref={ref}>{children}</div>
    </div>
  )
}
