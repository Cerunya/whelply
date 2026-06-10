import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Whelply – Rassehunde von seriösen Züchtern',
  description: 'Die Plattform für seriöse Rassehunde-Züchter in Deutschland. Nur FCI-anerkannte Rassen.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
