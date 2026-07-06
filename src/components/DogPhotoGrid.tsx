'use client'

import { useState } from 'react'

type DogMedia = {
  id: string
  url: string
  purpose: string | null
}

export default function DogPhotoGrid({ media, dogName }: { media: DogMedia[]; dogName: string }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (media.length === 0) return null

  const primary = media.find((m) => m.purpose === 'primary') ?? media[0]
  const grid_tl = media.find((m) => m.purpose === 'grid_tl')
  const grid_tr = media.find((m) => m.purpose === 'grid_tr')
  const grid_bl = media.find((m) => m.purpose === 'grid_bl')
  const grid_br = media.find((m) => m.purpose === 'grid_br')
  const hasGrid = grid_tl || grid_tr || grid_bl || grid_br
  const galleryOnly = media.filter((m) => !m.purpose && m.id !== primary?.id)
  const allUrls = media.map((m) => m.url)

  function openLightbox(url: string) {
    const idx = allUrls.indexOf(url)
    setLightboxIdx(idx >= 0 ? idx : 0)
  }

  return (
    <>
      {/* Grid oder Einzelbild */}
      {hasGrid ? (
        <div
          className="rounded-2xl overflow-hidden mb-4 cursor-pointer"
          style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gridTemplateRows: '1fr 1fr', gap: '3px', height: '480px' }}
        >
          <GridCell img={grid_tl} onClick={openLightbox} />
          <div
            style={{ gridColumn: '2', gridRow: '1 / 3' }}
            className="overflow-hidden bg-cream-dark relative"
            onClick={() => primary && openLightbox(primary.url)}
          >
            {primary && <img src={primary.url} alt={dogName} className="w-full h-full object-cover" />}
            {galleryOnly.length > 0 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm">
                {media.length} Fotos ansehen
              </div>
            )}
          </div>
          <GridCell img={grid_tr} onClick={openLightbox} />
          <GridCell img={grid_bl} onClick={openLightbox} />
          <GridCell img={grid_br} onClick={openLightbox} />
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden mb-4 bg-cream-dark cursor-pointer relative"
          style={{ height: '400px' }}
          onClick={() => primary && openLightbox(primary.url)}
        >
          {primary && <img src={primary.url} alt={dogName} className="w-full h-full object-cover" />}
          {media.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm">
              {media.length} Fotos ansehen
            </div>
          )}
        </div>
      )}

      {/* Galerie-Thumbnails (nur ohne Position) */}
      {galleryOnly.length > 0 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {galleryOnly.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="h-20 w-20 object-cover rounded-xl flex-shrink-0 border border-cream-deep cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => openLightbox(img.url)}
            />
          ))}
        </div>
      )}
      {galleryOnly.length === 0 && <div className="mb-8" />}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-stone-300 z-10"
            onClick={() => setLightboxIdx(null)}
          >
            ✕
          </button>

          {allUrls.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl font-bold hover:text-stone-300 z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + allUrls.length) % allUrls.length) }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl font-bold hover:text-stone-300 z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % allUrls.length) }}
              >
                ›
              </button>
            </>
          )}

          <img
            src={allUrls[lightboxIdx]}
            alt={dogName}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 text-white text-sm">
            {lightboxIdx + 1} / {allUrls.length}
          </div>
        </div>
      )}
    </>
  )
}

function GridCell({ img, onClick }: { img?: DogMedia; onClick: (url: string) => void }) {
  return (
    <div className="overflow-hidden bg-cream-dark" onClick={() => img && onClick(img.url)}>
      {img ? <img src={img.url} alt="" className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" /> : null}
    </div>
  )
}
