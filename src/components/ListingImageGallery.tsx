'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

type MediaItem = { id: string; url: string; isPrimary: boolean }

export default function ListingImageGallery({ media, breedName }: { media: MediaItem[]; breedName: string }) {
  const primaryIdx = media.findIndex((m) => m.isPrimary)
  const [active, setActive] = useState(primaryIdx >= 0 ? primaryIdx : 0)
  const [lightbox, setLightbox] = useState<number | null>(null)

  function prev() { setActive((i) => (i - 1 + media.length) % media.length) }
  function next() { setActive((i) => (i + 1) % media.length) }
  function prevLb() { setLightbox((i) => ((i ?? 0) - 1 + media.length) % media.length) }
  function nextLb() { setLightbox((i) => ((i ?? 0) + 1) % media.length) }

  return (
    <>
      <div className="space-y-3">
        {/* Hauptbild — klickbar zum Zoomen */}
        <div className="bg-cream-dark rounded-2xl overflow-hidden border border-cream-deep relative cursor-zoom-in"
          onClick={() => setLightbox(active)}>
          <img src={media[active].url} alt={breedName}
            className="w-full object-cover"
            style={{ maxHeight: '520px', width: '100%' }} />
          {/* Zoom-Icon */}
          <div className="absolute top-3 right-3 bg-black/30 rounded-full p-1.5 text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
          {media.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <span className="absolute bottom-2 right-3 text-white/70 text-xs bg-black/20 rounded px-1.5 py-0.5">
                {active + 1} / {media.length}
              </span>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {media.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {media.map((m, i) => (
              <button key={m.id} onClick={() => setActive(i)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                  i === active ? 'border-forest opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                }`}>
                <img src={m.url} alt={`${breedName} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}>
          <img src={media[lightbox].url} alt={breedName}
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {media.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevLb() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextLb() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {(lightbox ?? 0) + 1} / {media.length}
              </span>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
