'use client'

import { useState, useRef } from 'react'
import { resizeImage } from '@/lib/image-resize'

export default function LitterImageUploader({
  litterId,
  initialUrl,
}: {
  litterId: string
  initialUrl?: string | null
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
    if (file.size > 25 * 1024 * 1024) {
      setError('Datei zu groß (max. 25 MB).')
      return
    }

    setUploading(true)
    try {
      const resized = await resizeImage(file, 1920, 0.85)

      const formData = new FormData()
      formData.append('file', resized)
      formData.append('litterId', litterId)

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

  return (
    <div>
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
          <div className="aspect-video relative">
            <img src={url} alt="Wurf-Titelbild" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity">
                Bild ändern
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <svg className="w-8 h-8 mx-auto text-stone-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-stone-500">
              {uploading ? (<><svg className="w-4 h-4 animate-spin mr-1.5 inline" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Wird hochgeladen …</>) : 'Ankündigungs- oder Titelbild für den Wurf hochladen'}
            </p>
            <p className="text-xs text-stone-400 mt-1">Optional · JPG, PNG oder WebP, max. 25 MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}
