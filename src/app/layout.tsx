import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Whelply – Rassewelpen von seriösen Züchtern',
    template: '%s | Whelply',
  },
  description: 'Die Plattform für seriöse Rassehunde-Züchter in Deutschland. Finde Welpen, Deckrüden und Dienstleister — nur FCI-anerkannte Rassen.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Whelply',
    title: 'Whelply – Rassewelpen von seriösen Züchtern',
    description: 'Die Plattform für seriöse Rassehunde-Züchter in Deutschland. Finde Welpen, Deckrüden und Dienstleister.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
