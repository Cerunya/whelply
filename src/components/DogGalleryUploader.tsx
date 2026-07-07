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

const POSITIONS = [
  { value: '', label: 'Nur in Galerie' },
  { value: 'primary', label: '📷 Hauptbild (Mitte, groß)' },
  { value: 'grid_tl', label: '↖ Oben links' },
  { value: 'grid_tr', label: '↗ Oben rechts' },
  { value: 'grid_bl', label: '↙ Unten links' },
  { value: 'grid_br', label: '↘ Unten rechts' },
]

export default function DogGalleryUploader({
  dogId, initialImages, simpleMode = false,
}: {
  dogId: string; initialImages: DogImage[]; simpleMode?: boolean
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
          setImages((prev) => [...prev, { id: data.id, url: data.url, isPrimary: prev.length === 0, sortOrder: prev.length, purpose: null }])
        }
      } catch { setError('Fehler beim Hochladen.') }
    }
    setUploading(false)
  }

  async function changePurpose(mediaId: string, purpose: string | null) {
    setImages((prev) => prev.map((img) => img.id === mediaId ? { ...img, purpose } : img))
    await fetch(`/api/media-item/${mediaId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purpose }) })
  }

  async function setAsPrimary(mediaId: string) {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === mediaId })))
    await fetch(`/api/media-item/${mediaId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPrimary: true }) })
  }

  async function deleteImage(mediaId: string) {
    setImages((prev) => prev.filter((img) => img.id !== mediaId))
    await fetch(`/api/media-item/${mediaId}`, { method: 'DELETE' })
  }

  const primary = images.find((i) => i.purpose === 'primary')
  const grid_tl = images.find((i) => i.purpose === 'grid_tl')
  const grid_tr = images.find((i) => i.purpose === 'grid_tr')
  const grid_bl = images.find((i) => i.purpose === 'grid_bl')
  const grid_br = images.find((i) => i.purpose === 'grid_br')
  const hasGrid = primary || grid_tl || grid_tr || grid_bl || grid_br

  return (
    <div className="space-y-5">
      {!simpleMode && hasGrid && (
        <div>
          <p className="text-xs text-stone-400 mb-2 font-medium">Vorschau der Anordnung:</p>
          <div className="rounded-xl overflow-hidden" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px', height: '200px' }}>
            <GCell img={grid_tl} label="O.L." />
            <div style={{ gridColumn: '2', gridRow: '1 / 3' }} className="overflow-hidden bg-stone-100">
              {primary ? <img src={primary.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-[10px]">Hauptbild</div>}
            </div>
            <GCell img={grid_tr} label="O.R." />
            <GCell img={grid_bl} label="U.L." />
            <GCell img={grid_br} label="U.R." />
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-xl border border-cream-deep overflow-hidden">
              <div className="relative aspect-square">
                <img src={img.url} className="w-full h-full object-cover" />
                <button onClick={() => deleteImage(img.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">✕</button>
                {/* Titelbild-Indikator */}
                {simpleMode && img.isPrimary && (
                  <span className="absolute bottom-1.5 left-1.5 bg-forest text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Titelbild</span>
                )}
              </div>
              {/* Deckrüden: Position-Dropdown */}
              {!simpleMode && (
                <div className="p-1.5">
                  <select value={img.purpose ?? ''} onChange={(e) => changePurpose(img.id, e.target.value || null)}
                    className="w-full text-[11px] border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-600 focus:outline-none focus:ring-1 focus:ring-forest/30">
                    {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              )}
              {/* Hündinnen: Titelbild-Button */}
              {simpleMode && !img.isPrimary && (
                <div className="p-1.5">
                  <button onClick={() => setAsPrimary(img.id)}
                    className="w-full text-[11px] text-forest font-semibold border border-forest/20 rounded-lg px-2 py-1.5 hover:bg-forest/5 transition-colors">
                    Als Titelbild setzen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }} onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${uploading ? 'border-forest/30 bg-cream/80' : 'border-stone-200 hover:border-forest/40 hover:bg-cream/50'}`}>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
          onChange={(e) => { handleFiles(e.target.files); if (inputRef.current) inputRef.current.value = '' }} />
        {uploading ? <p className="text-sm text-forest">Wird hochgeladen…</p> : (
          <>
            <p className="text-sm text-stone-500 font-medium">Bilder hochladen</p>
            <p className="text-xs text-stone-400 mt-1">Mehrere auf einmal möglich · JPG, PNG, WebP</p>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!simpleMode ? (
        <p className="text-xs text-stone-400">Weise jedem Bild eine Position zu. Das <strong>Hauptbild</strong> wird groß in der Mitte angezeigt.</p>
      ) : (
        <p className="text-xs text-stone-400">Wähle ein Titelbild — dieses wird in der Übersicht und als Hauptbild angezeigt.</p>
      )}
    </div>
  )
}

function GCell({ img, label }: { img?: DogImage; label: string }) {
  return (
    <div className="overflow-hidden bg-stone-100">
      {img ? <img src={img.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-[10px]">{label}</div>}
    </div>
  )
}
