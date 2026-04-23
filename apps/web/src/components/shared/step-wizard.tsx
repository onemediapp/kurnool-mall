'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './index'

export interface WizardStep {
  id: string
  label: string
  canAdvance?: boolean
  content: React.ReactNode
}

interface StepWizardProps {
  steps: WizardStep[]
  current: number
  onChange: (index: number) => void
  onSubmit: () => void | Promise<void>
  submitLabel?: string
  loading?: boolean
  title?: string
}

export function StepWizard({
  steps, current, onChange, onSubmit, submitLabel = 'Submit', loading, title,
}: StepWizardProps) {
  const step = steps[current]
  const isLast = current === steps.length - 1
  const canAdvance = step?.canAdvance ?? true

  const next = () => {
    if (!canAdvance) return
    if (isLast) { void onSubmit(); return }
    onChange(current + 1)
  }
  const prev = () => current > 0 && onChange(current - 1)

  return (
    <div className="flex flex-col h-full">
      {title && <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {steps.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => i < current && onChange(i)}
                disabled={i > current}
                className={cn(
                  'flex items-center gap-2 text-xs font-medium whitespace-nowrap',
                  active && 'text-[#1A56DB]',
                  done && 'text-green-600',
                  !active && !done && 'text-gray-400',
                )}
              >
                <span
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold',
                    active && 'bg-[#1A56DB] text-white',
                    done && 'bg-green-100 text-green-700',
                    !active && !done && 'bg-gray-100 text-gray-400',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden md:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn('h-px flex-1', i < current ? 'bg-green-400' : 'bg-gray-200')} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Current step content */}
      <div className="flex-1 min-h-0 overflow-y-auto">{step?.content}</div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <Button
          variant="ghost"
          icon={<ChevronLeft className="h-4 w-4" />}
          onClick={prev}
          disabled={current === 0 || loading}
        >
          Back
        </Button>
        <span className="text-xs text-gray-400">
          Step {current + 1} / {steps.length}
        </span>
        <Button
          variant="primary"
          icon={isLast ? undefined : <ChevronRight className="h-4 w-4" />}
          onClick={next}
          disabled={!canAdvance || loading}
          loading={loading}
        >
          {isLast ? submitLabel : 'Next'}
        </Button>
      </div>
    </div>
  )
}
