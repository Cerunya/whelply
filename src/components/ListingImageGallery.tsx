'use client'

import { useState } from 'react'

type MediaItem = { id: string; url: string; isPrimary: boolean }

export default function ListingImageGallery({
  media,
  breedName,
}: {
  media: MediaItem[]
  breedName: string
}) {
  const primaryIdx = media.findIndex((m) => m.isPrimary)
  const [active, setActive] = useState(primaryIdx >= 0 ? primaryIdx : 0)

  return (
    <div className="space-y-3">
      {/* Hauptbild */}
      <div className="bg-cream-dark rounded-2xl aspect-square overflow-hidden border border-cream-deep relative">
        <img
          src={media[active].url}
          alt={breedName}
          className="w-full h-full object-cover"
        />
        {media.length > 1 && (
          <>
            <button
              onClick={() => setActive((i) => (i - 1 + media.length) % media.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              aria-label="Vorheriges Bild"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActive((i) => (i + 1) % media.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              aria-label="Nächstes Bild"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="absolute bottom-2 right-3 text-white/70 text-xs">
              {active + 1} / {media.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === active ? 'border-forest' : 'border-cream-deep hover:border-stone-400'
              }`}
            >
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
