'use client'

import { Toaster as SonnerToaster } from 'sonner'
export { toast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={80}
      toastOptions={{
        style: {
          fontFamily: "'Plus Jakarta Sans', 'Noto Sans Telugu', system-ui, sans-serif",
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
