'use client'

import { useState, useRef } from 'react'

type MediaItem = { id: string; url: string; isPrimary: boolean }

export default function ImageUploader({
  listingId,
  initialMedia = [],
}: {
  listingId: string
  initialMedia?: MediaItem[]
}) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)

    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Nur JPG, PNG oder WebP erlaubt.')
        continue
      }
      if (file.size > 8 * 1024 * 1024) {
        setError('Datei zu groß (max. 8 MB).')
        continue
      }

      try {
        // Schritt 1: Presigned URL anfordern
        const presignRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            fileName: file.name,
            contentType: file.type,
          }),
        })
        if (!presignRes.ok) throw new Error('Presign fehlgeschlagen')
        const { uploadUrl, storageKey } = await presignRes.json()

        // Schritt 2: Direkt zu MinIO hochladen
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!uploadRes.ok) throw new Error('Upload fehlgeschlagen')

        // Schritt 3: In DB registrieren
        const completeRes = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, storageKey, isPrimary: media.length === 0 }),
        })
        if (!completeRes.ok) throw new Error('Speichern fehlgeschlagen')
        const { id, url } = await completeRes.json()

        setMedia((prev) => [...prev, { id, url, isPrimary: prev.length === 0 }])
      } catch (err) {
        setError('Fehler beim Hochladen. Bitte erneut versuchen.')
      }
    }

    setUploading(false)
  }

  async function handleDelete(mediaId: string) {
    const res = await fetch(`/api/media-item/${mediaId}`, { method: 'DELETE' })
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== mediaId))
    }
  }

  return (
    <div>
      <div
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center cursor-pointer hover:border-forest/40 hover:bg-cream/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <svg className="w-8 h-8 mx-auto text-stone-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-stone-500">
          {uploading ? 'Wird hochgeladen...' : 'Bilder hierher ziehen oder klicken'}
        </p>
        <p className="text-xs text-stone-400 mt-1">JPG, PNG oder WebP, max. 8 MB</p>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {media.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
          {media.map((m) => (
            <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden border border-cream-deep group">
              <img src={m.url} alt="" className="w-full h-full object-cover" />
              {m.isPrimary && (
                <span className="absolute top-1 left-1 bg-honey text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Titelbild
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
