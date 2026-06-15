'use client'

import { useState, useRef } from 'react'
import { resizeImage } from '@/lib/image-resize'

export default function BreederImageUploader({
  purpose,
  initialUrl,
  label,
  hint,
  aspect = 'aspect-video',
}: {
  purpose: 'header' | 'background'
  initialUrl?: string | null
  label: string
  hint?: string
  aspect?: string
}) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | null) {
    if (!file) return
    setError('')

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Nur JPG, PNG oder WebP erlaubt.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Datei zu groß (max. 8 MB).')
      return
    }

    setUploading(true)
    try {
      const resized = await resizeImage(file, 1920, 0.85)

      const formData = new FormData()
      formData.append('file', resized)
      formData.append('purpose', purpose)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Upload fehlgeschlagen')
      }

      const data = await res.json()
      setUrl(data.url)
    } catch (err: any) {
      setError(err.message ?? 'Fehler beim Hochladen.')
    }
    setUploading(false)
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    setError('')
    setUploading(true)
    try {
      const res = await fetch(`/api/upload?purpose=${purpose}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Fehler beim Entfernen.')
      }
      setUrl(null)
    } catch (err: any) {
      setError(err.message ?? 'Fehler beim Entfernen.')
    }
    setUploading(false)
  }

  return (
    <div>
      <p className="text-sm font-semibold text-stone-700 mb-1">{label}</p>
      {hint && <p className="text-xs text-stone-400 mb-2">{hint}</p>}
      <div
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null) }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-stone-200 rounded-xl overflow-hidden cursor-pointer hover:border-forest/40 hover:bg-cream/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {url ? (
          <div className={`${aspect} relative`}>
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-3">
              <span className="text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity">
                Bild ändern
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity underline"
              >
                Entfernen
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <svg className="w-8 h-8 mx-auto text-stone-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-stone-500">
              {uploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
            </p>
            <p className="text-xs text-stone-400 mt-1">Optional · JPG, PNG oder WebP, max. 8 MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}
