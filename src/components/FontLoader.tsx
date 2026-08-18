'use client'

import { useEffect } from 'react'
import { googleFontsUrl } from '@/lib/fonts'

/**
 * Lädt die im Artikel verwendeten Google Fonts dynamisch nach.
 * Nur die tatsächlich genutzten Fonts — nicht den ganzen Katalog.
 */
export default function FontLoader({ fonts }: { fonts: string[] }) {
  useEffect(() => {
    const href = googleFontsUrl(fonts)
    if (!href) return
    if (document.querySelector('link[data-whelply-fonts]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-whelply-fonts', '1')
    document.head.appendChild(link)
  }, [fonts])

  return null
}
