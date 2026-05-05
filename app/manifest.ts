import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sharely',
    short_name: 'Sharely',
    description: 'Split expenses. Not friendships',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/desktoplogo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/desktoplogo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
