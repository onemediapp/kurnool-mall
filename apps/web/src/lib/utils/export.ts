import Papa from 'papaparse'

export interface CSVColumn<T> {
  key: keyof T | string
  label: string
  format?: (row: T) => string | number
}

// Browser-side CSV download via PapaParse.
export function exportToCSV<T>(
  filename: string,
  rows: T[],
  columns: CSVColumn<T>[]
): void {
  if (typeof window === 'undefined') return
  const header = columns.map((c) => c.label)
  const data = rows.map((row) =>
    columns.map((c) => {
      if (c.format) return c.format(row)
      const v = (row as Record<string, unknown>)[c.key as string]
      if (v === null || v === undefined) return ''
      if (typeof v === 'object') return JSON.stringify(v)
      return String(v)
    })
  )
  const csv = Papa.unparse({ fields: header, data })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

// Client-only PDF export from a DOM element. Dynamic import keeps
// jspdf + html2canvas out of the SSR bundle.
export async function exportToPDF(
  element: HTMLElement | null,
  filename: string,
  opts?: { landscape?: boolean; title?: string }
): Promise<void> {
  if (!element || typeof window === 'undefined') return
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const orientation = opts?.landscape ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'px', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const margin = 24
  const contentWidth = pageWidth - margin * 2
  const scaleFactor = contentWidth / canvas.width
  const imgHeight = canvas.height * scaleFactor

  let y = margin
  if (opts?.title) {
    pdf.setFontSize(14)
    pdf.setTextColor('#111827')
    pdf.text(opts.title, margin, y + 8)
    y += 28
  }

  // Paginate if image is taller than one page.
  let heightLeft = imgHeight
  let position = y
  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
  heightLeft -= pageHeight - position - margin

  while (heightLeft > 0) {
    pdf.addPage()
    position = -(imgHeight - heightLeft) + margin
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
