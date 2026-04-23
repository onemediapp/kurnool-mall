'use client'

import { Trash2, Plus } from 'lucide-react'
import { cn } from '@kurnool-mall/shared-utils'
import type { AudienceSegment, AudienceRule } from '@kurnool-mall/shared-types'

interface SegmentBuilderProps {
  value: AudienceSegment
  onChange: (v: AudienceSegment) => void
  className?: string
}

const FIELDS: { value: AudienceRule['field']; label: string }[] = [
  { value: 'role', label: 'User role' },
  { value: 'loyalty_tier', label: 'Loyalty tier' },
  { value: 'total_orders', label: 'Total orders' },
  { value: 'last_order_days', label: 'Days since last order' },
  { value: 'city', label: 'City' },
  { value: 'signup_days', label: 'Days since signup' },
  { value: 'language_pref', label: 'Language' },
]

const OPS: { value: AudienceRule['op']; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'in', label: 'in' },
]

export function SegmentBuilder({ value, onChange, className }: SegmentBuilderProps) {
  const update = (patch: Partial<AudienceSegment>) => onChange({ ...value, ...patch })

  const addRule = () => {
    const newRule: AudienceRule = { field: 'role', op: 'eq', value: 'customer' }
    update({ rules: [...value.rules, newRule] })
  }
  const removeRule = (i: number) => update({ rules: value.rules.filter((_, idx) => idx !== i) })
  const updateRule = (i: number, patch: Partial<AudienceRule>) =>
    update({
      rules: value.rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    })

  return (
    <div className={cn('space-y-3', className)}>
      {/* Match mode */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Match</span>
        <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
          {(['all', 'any'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update({ match: m })}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md',
                value.match === m ? 'bg-white text-[#1A56DB] shadow-sm' : 'text-gray-500',
              )}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">of the following rules</span>
      </div>

      {/* Rules */}
      <div className="space-y-2">
        {value.rules.map((rule, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
            <select
              value={rule.field}
              onChange={(e) =>
                updateRule(i, { field: e.target.value as AudienceRule['field'] })
              }
              className="text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md"
            >
              {FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <select
              value={rule.op}
              onChange={(e) => updateRule(i, { op: e.target.value as AudienceRule['op'] })}
              className="text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md"
            >
              {OPS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={Array.isArray(rule.value) ? rule.value.join(',') : String(rule.value)}
              onChange={(e) => {
                const raw = e.target.value
                const parsed =
                  rule.op === 'in'
                    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
                    : /^\d+$/.test(raw)
                      ? Number(raw)
                      : raw
                updateRule(i, { value: parsed })
              }}
              placeholder="value"
              className="flex-1 text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md"
            />
            <button
              type="button"
              onClick={() => removeRule(i)}
              className="p-1.5 text-gray-400 hover:text-red-600"
              aria-label="Remove rule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRule}
        className="inline-flex items-center gap-1 text-xs text-[#1A56DB] font-medium hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add rule
      </button>
    </div>
  )
}
