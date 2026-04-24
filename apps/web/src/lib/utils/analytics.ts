import type { HeatmapCell, FunnelStep, CohortRow, RFMSegment } from '@kurnool-mall/shared-types'

// ── Heatmap ───────────────────────────────────────────────────
// Build a 7×24 grid from sparse heatmap cells. Missing cells default to 0.
export function buildHeatmapGrid(cells: HeatmapCell[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const c of cells) {
    if (c.day_of_week >= 0 && c.day_of_week < 7 && c.hour >= 0 && c.hour < 24) {
      grid[c.day_of_week][c.hour] = c.count
    }
  }
  return grid
}

export function bucketByDayOfWeek(cells: HeatmapCell[]): number[] {
  const totals = Array(7).fill(0)
  for (const c of cells) totals[c.day_of_week] += c.count
  return totals
}

export const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Funnel ────────────────────────────────────────────────────
export function buildFunnel(
  steps: { name: string; count: number }[]
): FunnelStep[] {
  return steps.map((s, i) => {
    if (i === 0) return { ...s, drop_off_pct: 0 }
    const prev = steps[i - 1].count
    const drop = prev > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0
    return { ...s, drop_off_pct: drop }
  })
}

// ── RFM ───────────────────────────────────────────────────────
export function rfmScoreToLabel(r: number, f: number, m: number): string {
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions'
  if (r >= 3 && f >= 3) return 'Loyal'
  if (r >= 4 && f <= 2) return 'New'
  if (r <= 2 && f >= 3) return 'At Risk'
  if (r <= 2 && f <= 2) return 'Lost'
  return 'Needs Attention'
}

export const RFM_LABEL_COLORS: Record<string, string> = {
  Champions: '#16A34A',
  Loyal: '#1A56DB',
  New: '#06B6D4',
  'At Risk': '#F59E0B',
  Lost: '#DC2626',
  'Needs Attention': '#8B5CF6',
}

export function groupRFMByLabel(segments: RFMSegment[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const s of segments) {
    counts[s.label] = (counts[s.label] ?? 0) + 1
  }
  return counts
}

// ── Cohort ────────────────────────────────────────────────────
export function cohortMatrixToRows(rows: CohortRow[], maxOffset = 12): {
  cohort: string
  size: number
  cells: (number | null)[]
}[] {
  return rows.map((r) => {
    const cells: (number | null)[] = Array(maxOffset).fill(null)
    r.retention.slice(0, maxOffset).forEach((pct, i) => {
      cells[i] = pct
    })
    return { cohort: r.cohort_month, size: r.cohort_size, cells }
  })
}

// Color a cohort cell by retention percentage (used as inline style).
export function cohortCellTint(pct: number | null): string {
  if (pct === null || pct === 0) return 'transparent'
  // primary blue with alpha proportional to percentage (0-100)
  const alpha = Math.min(1, pct / 100) * 0.9 + 0.05
  return `rgba(26, 86, 219, ${alpha.toFixed(2)})`
}
