'use client'

import { useState, useRef } from 'react'
import { resizeImage } from '@/lib/image-resize'

type GalleryImage = { id: string; url: string }

export default function GalleryManager({ initialImages }: { initialImages: GalleryImage[] }) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages)
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
      if (file.size > 25 * 1024 * 1024) {
        setError('Datei zu groß (max. 25 MB).')
        continue
      }

      try {
        const resized = await resizeImage(file, 1920, 0.85)

        const formData = new FormData()
        formData.append('file', resized)
        formData.append('purpose', 'gallery')

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Upload fehlgeschlagen')
        }

        const data = await res.json()
        setImages((prev) => [...prev, { id: data.id, url: data.url }])
      } catch (err: any) {
        setError(err.message ?? 'Fehler beim Hochladen.')
      }
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleRemove(id: string) {
    setError('')
    const res = await fetch(`/api/upload?mediaId=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== id))
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Entfernen.')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center cursor-pointer hover:border-forest/40 hover:bg-cream/50 transition-colors"
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
          {uploading ? (<><svg className="w-4 h-4 animate-spin mr-1.5 inline" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Wird hochgeladen …</>) : 'Bilder hochladen (mehrere möglich)'}
        </p>
        <p className="text-xs text-stone-400 mt-1">JPG, PNG oder WebP, je max. 25 MB</p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="aspect-square relative rounded-xl overflow-hidden border border-cream-deep group">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity underline"
                >
                  Entfernen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
