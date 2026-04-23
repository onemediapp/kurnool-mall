'use client'

import { Toaster as SonnerToaster } from 'sonner'
export { toast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      duration={3000}
      toastOptions={{
        style: {
          fontFamily: "'Inter', 'Noto Sans Telugu', system-ui, sans-serif",
          borderRadius: '0.75rem',
          fontSize: '14px',
        },
        classNames: {
          toast: 'shadow-modal',
          success: 'border-green-100',
          error: 'border-red-100',
        },
      }}
      richColors
    />
  )
}
