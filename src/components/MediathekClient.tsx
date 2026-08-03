'use client'

import { useState, useRef } from 'react'

type MediaItem = {
  id: string
  url: string
  storageKey: string
  altText: string | null
  createdAt: string
}

export default function MediathekClient({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      try {
        const formData = new FormData()
        formData.append('file', files[i])
        const res = await fetch('/api/admin/mediathek', { method: 'POST', body: formData })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Upload fehlgeschlagen')
        }
        const data = await res.json()
        setMedia((prev) => [{ id: data.id, url: data.url, storageKey: '', altText: null, createdAt: new Date().toISOString() }, ...prev])
      } catch (e: any) {
        setError(e.message)
      }
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (!confirm('Datei endgültig löschen?')) return
    const res = await fetch(`/api/admin/mediathek?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== id))
    }
  }

  function copyUrl(url: string) {
    const fullUrl = `${window.location.origin}${url}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  function copyMarkdown(url: string, alt: string | null) {
    const fullUrl = `${window.location.origin}${url}`
    const isPdf = url.endsWith('.pdf')
    const md = isPdf ? `[📎 Download](${fullUrl})` : `![${alt || 'Bild'}](${fullUrl})`
    navigator.clipboard.writeText(md)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const isPdf = (url: string) => url.includes('.pdf')

  return (
    <div>
      {/* Upload-Bereich */}
      <div className="mb-8">
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center cursor-pointer hover:border-forest/40 hover:bg-cream/50 transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => { handleUpload(e.target.files); }}
          />
          {uploading ? (
            <p className="text-sm text-forest font-medium">Wird hochgeladen…</p>
          ) : (
            <>
              <p className="text-stone-500 text-sm">Bilder oder PDFs hierher ziehen oder klicken</p>
              <p className="text-stone-400 text-xs mt-1">JPG, PNG, WebP, GIF, PDF · max. 25 MB · mehrere Dateien möglich</p>
            </>
          )}
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Medien-Grid */}
      {media.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-stone-500">Noch keine Dateien hochgeladen</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-cream-deep overflow-hidden group relative">
              {/* Vorschau */}
              <div className="aspect-square bg-cream flex items-center justify-center overflow-hidden">
                {isPdf(item.url) ? (
                  <div className="text-center">
                    <p className="text-3xl mb-1">📄</p>
                    <p className="text-xs text-stone-400">PDF</p>
                  </div>
                ) : (
                  <img src={item.url} alt={item.altText || ''} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Hover-Aktionen */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(item.url)}
                  className="bg-white text-stone-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-50"
                >
                  {copied === item.url ? '✓ Kopiert!' : 'URL kopieren'}
                </button>
                <button
                  onClick={() => copyMarkdown(item.url, item.altText)}
                  className="bg-white/80 text-stone-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white"
                >
                  Markdown kopieren
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-300 text-xs hover:text-red-100 mt-1"
                >
                  Löschen
                </button>
              </div>

              {/* Datum */}
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-stone-400 truncate">
                  {new Date(item.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
