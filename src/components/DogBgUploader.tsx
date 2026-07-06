'use client'

import { useState, useRef } from 'react'
import { resizeImage } from '@/lib/image-resize'

export default function DogBgUploader({
  dogId,
  initialUrl,
}: {
  dogId: string
  initialUrl: string | null
}) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | null) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Nur JPG, PNG oder WebP erlaubt.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const resized = await resizeImage(file, 2400, 0.85)
      const formData = new FormData()
      formData.append('file', resized)
      formData.append('dogId', dogId)
      formData.append('dogPurpose', 'dog_bg')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setUrl(data.url)
      } else {
        setError('Fehler beim Hochladen.')
      }
    } catch {
      setError('Fehler beim Hochladen.')
    }
    setUploading(false)
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors ${
          url ? 'border-transparent' : 'border-stone-200 hover:border-forest/40'
        }`}
        style={{ height: '160px' }}
      >
        {url ? (
          <img src={url} alt="Hintergrund" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-cream flex flex-col items-center justify-center">
            <p className="text-sm text-stone-400">Hintergrundbild hochladen</p>
            <p className="text-xs text-stone-300 mt-1">Querformat empfohlen · min. 1200×400 px</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <p className="text-sm text-forest">Wird hochgeladen…</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {url && (
        <button onClick={() => inputRef.current?.click()} className="text-xs text-forest mt-1.5 hover:underline">
          Hintergrundbild ändern
        </button>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
