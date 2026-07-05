'use client'

import { useState, useRef } from 'react'
import { resizeImage } from '@/lib/image-resize'

type DogImage = {
  id: string
  url: string
  isPrimary: boolean
  sortOrder: number
  purpose: string | null
}

// purpose values: null=gallery, 'primary'=main, 'grid_tl'=top-left, etc.
const POSITION_LABELS: Record<string, string> = {
  primary: '📷 Hauptbild (Mitte groß)',
  grid_tl: '↖ Oben links',
  grid_bl: '↙ Unten links',
  grid_tr: '↗ Oben rechts',
  grid_br: '↘ Unten rechts',
}

export default function DogGalleryUploader({
  dogId,
  initialImages,
}: {
  dogId: string
  initialImages: DogImage[]
}) {
  const [images, setImages] = useState<DogImage[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)

    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue
      try {
        const resized = await resizeImage(file, 1920, 0.85)
        const formData = new FormData()
        formData.append('file', resized)
        formData.append('dogId', dogId)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          const newImg: DogImage = {
            id: data.id ?? Date.now().toString(),
            url: data.url,
            isPrimary: images.length === 0,
            sortOrder: images.length,
            purpose: null,
          }
          setImages((prev) => [...prev, newImg])
        }
      } catch (e) {
        setError('Fehler beim Hochladen.')
      }
    }
    setUploading(false)
  }

  async function setPurpose(mediaId: string, purpose: string | null) {
    // Optimistic update
    setImages((prev) => prev.map((img) => img.id === mediaId ? { ...img, purpose } : img))
    await fetch(`/api/media-item/${mediaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose }),
    })
  }

  async function deleteImage(mediaId: string) {
    setImages((prev) => prev.filter((img) => img.id !== mediaId))
    await fetch(`/api/media-item/${mediaId}`, { method: 'DELETE' })
  }

  const gridImages = {
    primary: images.find((i) => i.purpose === 'primary'),
    grid_tl: images.find((i) => i.purpose === 'grid_tl'),
    grid_bl: images.find((i) => i.purpose === 'grid_bl'),
    grid_tr: images.find((i) => i.purpose === 'grid_tr'),
    grid_br: images.find((i) => i.purpose === 'grid_br'),
  }
  const galleryImages = images.filter((i) => !i.purpose)

  return (
    <div className="space-y-6">
      {/* Vorschau wie auf der Profilseite */}
      {Object.values(gridImages).some(Boolean) && (
        <div className="rounded-xl overflow-hidden bg-cream-dark" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gridTemplateRows: '1fr 1fr', gap: '3px', height: '320px' }}>
          <div style={{ gridColumn: '1', gridRow: '1' }} className="overflow-hidden bg-stone-200">
            {gridImages.grid_tl ? <img src={gridImages.grid_tl.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">O.L.</div>}
          </div>
          <div style={{ gridColumn: '2', gridRow: '1 / 3' }} className="overflow-hidden bg-stone-200">
            {gridImages.primary ? <img src={gridImages.primary.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">Hauptbild</div>}
          </div>
          <div style={{ gridColumn: '3', gridRow: '1' }} className="overflow-hidden bg-stone-200">
            {gridImages.grid_tr ? <img src={gridImages.grid_tr.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">O.R.</div>}
          </div>
          <div style={{ gridColumn: '1', gridRow: '2' }} className="overflow-hidden bg-stone-200">
            {gridImages.grid_bl ? <img src={gridImages.grid_bl.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">U.L.</div>}
          </div>
          <div style={{ gridColumn: '3', gridRow: '2' }} className="overflow-hidden bg-stone-200">
            {gridImages.grid_br ? <img src={gridImages.grid_br.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">U.R.</div>}
          </div>
        </div>
      )}

      {/* Alle hochgeladenen Bilder */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.url} className="w-full aspect-square object-cover rounded-xl border-2 border-cream-deep" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-1 p-1">
                <button onClick={() => deleteImage(img.id)}
                  className="text-white text-[10px] bg-red-500 rounded px-2 py-0.5 w-full">Löschen</button>
              </div>
              <select
                value={img.purpose ?? ''}
                onChange={(e) => setPurpose(img.id, e.target.value || null)}
                className="mt-1 w-full text-[10px] border border-stone-200 rounded px-1 py-0.5 bg-white text-stone-600"
              >
                <option value="">Galerie</option>
                {Object.entries(POSITION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      <div
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${uploading ? 'border-forest/30 bg-cream/80 cursor-wait' : 'border-stone-200 cursor-pointer hover:border-forest/40 hover:bg-cream/50'}`}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-6 h-6 text-forest animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-sm text-forest">Wird hochgeladen…</p>
          </div>
        ) : (
          <>
            <svg className="w-7 h-7 mx-auto text-stone-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-stone-500">Bilder hochladen</p>
            <p className="text-xs text-stone-400 mt-1">Mehrere Bilder auf einmal möglich</p>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <p className="text-xs text-stone-400">Weise jedem Bild eine Position zu. Bilder ohne Position erscheinen in der Galerie-Lightbox.</p>
    </div>
  )
}
