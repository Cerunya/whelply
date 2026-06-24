'use client'

import { useRef, useCallback, useState } from 'react'

type RichEditorProps = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export default function RichEditor({ value, onChange, placeholder, rows = 6, className = '' }: RichEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const wrap = useCallback((marker: string) => {
    const el = ref.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value: v } = el
    const selected = v.slice(s, e) || 'Text'
    const newVal = v.slice(0, s) + marker + selected + marker + v.slice(e)
    onChange(newVal)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + marker.length, s + marker.length + selected.length)
    })
  }, [onChange])

  const insert = useCallback((text: string) => {
    const el = ref.current
    if (!el) return
    const { selectionStart: s, value: v } = el
    const newVal = v.slice(0, s) + text + v.slice(s)
    onChange(newVal)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + text.length, s + text.length)
    })
  }, [onChange])

  function handleImageUrl() {
    const url = window.prompt('Bild-URL eingeben:')
    if (!url) return
    const alt = window.prompt('Bildbeschreibung (optional):') ?? ''
    insert(`\n![${alt}](${url})\n`)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'bio')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        insert(`\n![](${data.url})\n`)
      } else {
        alert('Upload fehlgeschlagen.')
      }
    } catch {
      alert('Upload fehlgeschlagen.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleYoutube() {
    const input = window.prompt('YouTube-URL oder Video-ID eingeben:')
    if (!input) return
    const match = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    const id = match ? match[1] : input.trim()
    insert(`\n@youtube[${id}]\n`)
  }

  const btnClass = 'w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-xs'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 flex-wrap">
        <button type="button" onClick={() => wrap('**')} className={btnClass} title="Fett">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => wrap('*')} className={`${btnClass} italic`} title="Kursiv">
          I
        </button>
        <div className="w-px h-5 bg-stone-200 mx-1" />
        <button type="button" onClick={handleImageUrl} className={btnClass} title="Bild per URL einfuegen">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={btnClass + (uploading ? ' opacity-50' : '')}
          title="Bild hochladen"
        >
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <button type="button" onClick={handleYoutube} className={btnClass} title="YouTube-Video einbetten">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
          </svg>
        </button>
        <p className="text-xs text-stone-400 ml-1">**fett**, *kursiv*</p>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
    </div>
  )
}
