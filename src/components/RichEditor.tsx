'use client'

import { useRef, useCallback } from 'react'

type RichEditorProps = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

// Welche Syntax wird unterstützt:
// **text** = fett
// *text* = kursiv
// ![alt](url) = Bild
// @youtube[video-id] = YouTube-Einbettung
// Zeilenumbrüche = <br>

export default function RichEditor({ value, onChange, placeholder, rows = 6, className = '' }: RichEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

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

  function handleYoutube() {
    const input = window.prompt('YouTube-URL oder Video-ID eingeben:')
    if (!input) return
    // Extract video ID from various YouTube URL formats
    const match = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    const id = match ? match[1] : input.trim()
    insert(`\n@youtube[${id}]\n`)
  }

  const btnClass = 'w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-xs'

  return (
    <div className="space-y-1.5">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        <button type="button" onClick={() => wrap('**')} className={btnClass} title="Fett">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => wrap('*')} className={`${btnClass} italic`} title="Kursiv">
          I
        </button>
        <div className="w-px h-5 bg-stone-200 mx-1" />
        <button type="button" onClick={handleImageUrl} className={btnClass} title="Bild einfügen (URL)">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button type="button" onClick={handleYoutube} className={btnClass} title="YouTube-Video einbetten">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
          </svg>
        </button>
        <p className="text-xs text-stone-400 ml-2">**fett**, *kursiv*, Bild-URL, YouTube</p>
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
