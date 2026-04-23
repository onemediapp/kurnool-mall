'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { DayPicker, type DateRange } from 'react-day-picker'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import 'react-day-picker/style.css'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

function fmt(d?: Date) {
  if (!d) return ''
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = 'Select date range',
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const label = value?.from
    ? value.to
      ? `${fmt(value.from)} – ${fmt(value.to)}`
      : fmt(value.from)
    : placeholder

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl',
            'hover:bg-gray-50 transition-colors',
            className,
          )}
        >
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className={value?.from ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          className="z-50 bg-white rounded-2xl shadow-modal border border-gray-100 p-3 animate-scale-in"
        >
          <DayPicker
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            showOutsideDays
            className="text-sm"
          />
          <div className="flex justify-between pt-2 mt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-[#1A56DB] font-medium hover:underline"
            >
              Apply
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
