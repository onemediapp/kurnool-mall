'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, BarChart, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Tabs, Spinner, KPICard, Button, DataTable, type DataTableColumn } from '@/components/shared'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { exportToPDF } from '@/lib/utils/export'
import { formatPrice, formatCompact, CHART_COLORS, formatDate } from '@kurnool-mall/shared-utils'
import {
  buildHeatmapGrid, DOW_LABELS, buildFunnel,
  groupRFMByLabel, RFM_LABEL_COLORS,
  cohortMatrixToRows, cohortCellTint,
} from '@/lib/utils/analytics'
import type { DateRange } from 'react-day-picker'
import type { RevenueStream, RFMSegment, CohortRow, HeatmapCell } from '@kurnool-mall/shared-types'

function defaultRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from, to }
}

export default function AnalyticsHubPage() {
  const [tab, setTab] = useState('overview')
  const [range, setRange] = useState<DateRange | undefined>(defaultRange)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Data-driven insights for your platform.</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'overview', label: 'Overview' },
          { value: 'revenue', label: 'Revenue' },
          { value: 'cohorts', label: 'Cohorts' },
          { value: 'rfm', label: 'RFM' },
          { value: 'funnel', label: 'Funnel' },
          { value: 'heatmap', label: 'Heatmap' },
        ]}
      />

      <div className="mt-4">
        {tab === 'overview' && <OverviewTab range={range} />}
        {tab === 'revenue' && <RevenueTab range={range} />}
        {tab === 'cohorts' && <CohortsTab range={range} />}
        {tab === 'rfm' && <RfmTab range={range} />}
        {tab === 'funnel' && <FunnelTab range={range} />}
        {tab === 'heatmap' && <HeatmapTab range={range} />}
      </div>
    </div>
  )
}

/* ────────── helpers ────────── */
function iso(d?: Date) { return d?.toISOString().slice(0, 10) ?? '' }
function rangeFrom(r?: DateRange) { return iso(r?.from) }
function rangeTo(r?: DateRange) { return iso(r?.to) }

/* ────────── OVERVIEW ────────── */
function OverviewTab({ range }: { range: DateRange | undefined }) {
  const [data, setData] = useState<RevenueStream[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase.rpc('revenue_by_stream', {
      start_date: rangeFrom(range),
      end_date: rangeTo(range),
    }).then(({ data: d }) => {
      setData((d as RevenueStream[] | null) ?? [])
      setLoading(false)
    })
  }, [range])

  const totals = useMemo(() => {
    let products = 0, services = 0, commission = 0
    for (const r of data) { products += r.products; services += r.services; commission += r.commission }
    return { products, services, commission, total: products + services }
  }, [data])

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>

  return (
    <div ref={ref}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KPICard label="Total revenue" value={formatCompact(totals.total)} icon={<span>💰</span>} />
        <KPICard label="Products" value={formatCompact(totals.products)} icon={<span>🛒</span>} />
        <KPICard label="Services" value={formatCompact(totals.services)} icon={<span>🔧</span>} />
        <KPICard label="Commission" value={formatCompact(totals.commission)} icon={<span>📈</span>} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Revenue overview</p>
          <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportToPDF(ref.current, 'analytics-overview.pdf', { title: 'Revenue overview' })}>
            PDF
          </Button>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatPrice(v)} />
              <Legend />
              <Bar dataKey="products" fill={CHART_COLORS[0]} name="Products" />
              <Bar dataKey="services" fill={CHART_COLORS[1]} name="Services" />
              <Line type="monotone" dataKey="commission" stroke={CHART_COLORS[2]} name="Commission" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ────────── REVENUE ────────── */
function RevenueTab({ range }: { range: DateRange | undefined }) {
  const [data, setData] = useState<RevenueStream[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase.rpc('revenue_by_stream', {
      start_date: rangeFrom(range),
      end_date: rangeTo(range),
    }).then(({ data: d }) => {
      setData((d as RevenueStream[] | null) ?? [])
      setLoading(false)
    })
  }, [range])

  const pieData = useMemo(() => {
    let products = 0, services = 0, commission = 0
    for (const r of data) { products += r.products; services += r.services; commission += r.commission }
    return [
      { name: 'Products', value: products },
      { name: 'Services', value: services },
      { name: 'Commission', value: commission },
    ]
  }, [data])

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>

  return (
    <div ref={ref}>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Revenue trend</p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Area type="monotone" dataKey="products" stackId="a" fill={CHART_COLORS[0]} stroke={CHART_COLORS[0]} fillOpacity={0.3} />
                <Area type="monotone" dataKey="services" stackId="a" fill={CHART_COLORS[1]} stroke={CHART_COLORS[1]} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Revenue split</p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatPrice(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportToPDF(ref.current, 'analytics-revenue.pdf', { title: 'Revenue' })}>
        Export PDF
      </Button>
    </div>
  )
}

/* ────────── COHORTS ────────── */
function CohortsTab({ range }: { range: DateRange | undefined }) {
  const [rows, setRows] = useState<CohortRow[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase.rpc('compute_cohort_retention', {
      cohort_month: rangeFrom(range)?.slice(0, 7) ?? new Date().toISOString().slice(0, 7),
    }).then(({ data: d }) => {
      setRows((d as CohortRow[] | null) ?? [])
      setLoading(false)
    })
  }, [range])

  const matrix = useMemo(() => cohortMatrixToRows(rows, 12), [rows])

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Cohort retention</p>
        <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportToPDF(ref.current, 'analytics-cohorts.pdf', { title: 'Cohort retention' })}>PDF</Button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left font-medium text-gray-500">Cohort</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Size</th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i} className="px-2 py-2 text-center font-medium text-gray-500">M{i}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {matrix.map((r) => (
              <tr key={r.cohort}>
                <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{r.cohort}</td>
                <td className="px-3 py-2 text-right text-gray-600">{r.size}</td>
                {r.cells.map((pct, i) => (
                  <td
                    key={i}
                    className="px-2 py-2 text-center font-medium"
                    style={{ backgroundColor: cohortCellTint(pct), color: pct !== null && pct > 50 ? '#fff' : '#374151' }}
                  >
                    {pct !== null ? `${pct}%` : ''}
                  </td>
                ))}
              </tr>
            ))}
            {matrix.length === 0 && (
              <tr><td colSpan={14} className="text-center py-8 text-gray-400">No cohort data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ────────── RFM ────────── */
function RfmTab({ range }: { range: DateRange | undefined }) {
  const [segments, setSegments] = useState<RFMSegment[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase.rpc('compute_rfm_segments', {
      start_date: rangeFrom(range),
      end_date: rangeTo(range),
    }).then(({ data: d }) => {
      setSegments((d as RFMSegment[] | null) ?? [])
      setLoading(false)
    })
  }, [range])

  const grouped = useMemo(() => groupRFMByLabel(segments), [segments])
  const scatterData = useMemo(() =>
    segments.slice(0, 200).map((s) => ({
      r: s.recency,
      f: s.frequency,
      m: s.monetary,
      label: s.label,
    })),
  [segments])

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">RFM Segmentation</p>
        <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportToPDF(ref.current, 'analytics-rfm.pdf', { title: 'RFM' })}>PDF</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(grouped).map(([label, count]) => (
          <div
            key={label}
            className="px-3 py-2 rounded-lg border"
            style={{ borderColor: RFM_LABEL_COLORS[label] ?? '#999', color: RFM_LABEL_COLORS[label] ?? '#999' }}
          >
            <p className="text-xs font-bold">{label}</p>
            <p className="text-lg font-bold">{count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs text-gray-500 mb-2">Recency (x) × Frequency (y) — dot size = Monetary</p>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="r" name="Recency" tick={{ fontSize: 11 }} />
              <YAxis dataKey="f" name="Frequency" tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill={CHART_COLORS[0]}>
                {scatterData.map((s, i) => (
                  <Cell key={i} fill={RFM_LABEL_COLORS[s.label] ?? CHART_COLORS[0]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ────────── FUNNEL ────────── */
function FunnelTab({ range }: { range: DateRange | undefined }) {
  const [steps, setSteps] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    const from = rangeFrom(range)
    const to = rangeTo(range)

    // Build funnel from analytics_events
    Promise.all(
      ['page_view', 'product_view', 'add_to_cart', 'checkout_start', 'order_completed'].map(
        (event) =>
          supabase
            .from('analytics_events')
            .select('id', { count: 'exact', head: true })
            .eq('event_name', event)
            .gte('created_at', from)
            .lte('created_at', to + 'T23:59:59')
      )
    ).then((results) => {
      const names = ['Page View', 'Product View', 'Add to Cart', 'Checkout', 'Order']
      setSteps(
        results.map((r, i) => ({ name: names[i], count: r.count ?? 0 }))
      )
      setLoading(false)
    })
  }, [range])

  const funnel = useMemo(() => buildFunnel(steps), [steps])

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Conversion funnel</p>
        <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportToPDF(ref.current, 'analytics-funnel.pdf', { title: 'Funnel' })}>PDF</Button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCompact(v)} />
              <Bar dataKey="count" fill={CHART_COLORS[0]}>
                {funnel.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-1">
          {funnel.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">{s.name}</span>
              <span className="text-gray-500">
                {formatCompact(s.count)}
                {i > 0 && (
                  <span className="text-red-600 ml-1">-{s.drop_off_pct}%</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ────────── HEATMAP ────────── */
function HeatmapTab({ range }: { range: DateRange | undefined }) {
  const [cells, setCells] = useState<HeatmapCell[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase.rpc('compute_hourly_heatmap', {
      start_date: rangeFrom(range),
      end_date: rangeTo(range),
    }).then(({ data: d }) => {
      setCells((d as HeatmapCell[] | null) ?? [])
      setLoading(false)
    })
  }, [range])

  const grid = useMemo(() => buildHeatmapGrid(cells), [cells])
  const maxVal = useMemo(() => Math.max(1, ...grid.flat()), [grid])

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Order heatmap (day × hour)</p>
        <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportToPDF(ref.current, 'analytics-heatmap.pdf', { title: 'Heatmap' })}>PDF</Button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `60px repeat(24, 28px)` }}>
          {/* Hour labels */}
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[9px] text-gray-400 text-center">{String(h).padStart(2, '0')}</div>
          ))}
          {/* Grid rows */}
          {grid.map((row, d) => (
            <>
              <div key={`label-${d}`} className="text-[10px] text-gray-600 font-medium flex items-center">{DOW_LABELS[d]}</div>
              {row.map((v, h) => {
                const alpha = v / maxVal
                return (
                  <div
                    key={`${d}-${h}`}
                    className="w-7 h-7 rounded-sm flex items-center justify-center text-[8px]"
                    style={{ backgroundColor: `rgba(26, 86, 219, ${(alpha * 0.85 + 0.05).toFixed(2)})`, color: alpha > 0.5 ? '#fff' : '#6b7280' }}
                    title={`${DOW_LABELS[d]} ${h}:00 — ${v} orders`}
                  >
                    {v || ''}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
