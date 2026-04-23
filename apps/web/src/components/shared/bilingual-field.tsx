'use client'

import { useState } from 'react'
import { cn } from '@kurnool-mall/shared-utils'

interface BilingualFieldProps {
  label: string
  valueEn: string
  valueTe: string
  onChangeEn: (v: string) => void
  onChangeTe: (v: string) => void
  required?: boolean
  placeholder?: string
  multiline?: boolean
  className?: string
}

// Paired English/Telugu input with a lang toggle tab.
export function BilingualField({
  label,
  valueEn,
  valueTe,
  onChangeEn,
  onChangeTe,
  required,
  placeholder,
  multiline,
  className,
}: BilingualFieldProps) {
  const [lang, setLang] = useState<'en' | 'te'>('en')
  const value = lang === 'en' ? valueEn : valueTe
  const setter = lang === 'en' ? onChangeEn : onChangeTe
  const fontClass = lang === 'te' ? 'font-telugu' : ''

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={cn(
              'px-2 py-0.5 rounded-md font-medium',
              lang === 'en' ? 'bg-white text-[#1A56DB] shadow-sm' : 'text-gray-500',
            )}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('te')}
            className={cn(
              'px-2 py-0.5 rounded-md font-medium',
              lang === 'te' ? 'bg-white text-[#1A56DB] shadow-sm' : 'text-gray-500',
            )}
          >
            తె
          </button>
        </div>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => setter(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none',
            'focus:border-[#1A56DB] focus:ring-2 focus:ring-[#1A56DB]/10 transition-colors',
            fontClass,
          )}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setter(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none',
            'focus:border-[#1A56DB] focus:ring-2 focus:ring-[#1A56DB]/10 transition-colors',
            fontClass,
          )}
        />
      )}
    </div>
  )
}

// Small inline helper to show EN+Telugu side-by-side
export function BilingualText({
  en,
  te,
  className,
}: {
  en: string
  te?: string | null
  className?: string
}) {
  return (
    <span className={className}>
      <span>{en}</span>
      {te && <span className="text-gray-500 font-telugu ml-1.5 text-xs">{te}</span>}
    </span>
  )
}
