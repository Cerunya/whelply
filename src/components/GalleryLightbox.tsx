'use client'

import { useState, useEffect, useCallback } from 'react'

type GalleryImage = { id: string; url: string }

export default function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null)

  const close = useCallback(() => setOpen(null), [])
  const prev = useCallback(() => setOpen((i) => (i !== null ? (i - 1 + images.length) % images.length : null)), [images.length])
  const next = useCallback(() => setOpen((i) => (i !== null ? (i + 1) % images.length : null)), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (open === null) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close, prev, next])

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setOpen(i)}
            className="aspect-square rounded-xl overflow-hidden border border-cream-deep block cursor-zoom-in hover:opacity-90 transition-opacity w-full"
            aria-label={`Foto ${i + 1} vergrößern`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox — z-[9999] um über allem (inkl. sticky Sidebar) zu liegen */}
      {open !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
          onClick={close}
          style={{ isolation: 'isolate' }}
        >
          {/* Bild */}
          <img
            src={images[open].url}
            alt=""
            className="relative max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Schließen */}
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl leading-none hover:bg-white/25 transition-colors"
            aria-label="Schließen"
          >
            ×
          </button>

          {/* Pfeil links */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
              aria-label="Vorheriges Bild"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Pfeil rechts */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
              aria-label="Nächstes Bild"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Zähler */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            {open + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  )
}
