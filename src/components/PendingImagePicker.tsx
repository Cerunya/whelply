'use client'

import { useEffect, useRef, useState } from 'react'

export default function PendingImagePicker({
  images,
  onChange,
}: {
  images: File[]
  onChange: (images: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [images])

  function handleImages(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 25 * 1024 * 1024
    )
    if (valid.length !== files.length) {
      setError('Nur JPG, PNG oder WebP bis maximal 25 MB pro Bild.')
    } else {
      setError('')
    }
    onChange([...images, ...valid])
  }

  return (
    <div>
      {previews.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3">
          {previews.map((url, index) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-cream-deep bg-cream">
              <img src={url} alt={`Ausgewähltes Bild ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                aria-label="Bild entfernen"
              >
                ✕
              </button>
              {index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">
                  Titelbild
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); handleImages(e.dataTransfer.files) }}
        onDragOver={(e) => e.preventDefault()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-stone-200 p-6 text-center hover:border-forest/40 hover:bg-cream/50"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => { handleImages(e.target.files); e.target.value = '' }}
        />
        <p className="text-sm font-medium text-stone-500">Bilder auswählen oder hierher ziehen</p>
        <p className="mt-1 text-xs text-stone-400">Mehrere möglich · werden beim Speichern hochgeladen</p>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
