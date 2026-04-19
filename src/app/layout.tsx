import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/shared'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kurnool Mall — Shop Local, Delivered Fast',
  description: 'Hyperlocal multi-vendor marketplace for Kurnool, Andhra Pradesh. Shop groceries, electronics, fashion, electricals, plumbing, building materials, stationery, and sweets from local vendors.',
  keywords: 'Kurnool, shopping, local market, delivery, groceries, electronics, fashion',
  openGraph: {
    title: 'Kurnool Mall',
    description: 'Shop local, delivered fast — Kurnool\'s own marketplace',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1A56DB" />
      </head>
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
