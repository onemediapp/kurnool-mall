import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kurnool Mall',
    short_name: 'KM',
    description: "Kurnool's local shopping app",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FC8019',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
