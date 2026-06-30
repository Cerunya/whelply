'use client'

import { useRef, useState } from 'react'

type RichEditorProps = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

// Wandelt Bild-Markdown in kurze Platzhalter um fuer die Textarea-Ansicht
// ![dateiname.png](url) → [📷 dateiname.png]
function toDisplay(md: string): string {
  return md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt) => `[📷 ${alt || 'Bild'}]`)
}

// Wandelt Platzhalter zurueck zu Bild-Markdown, mit Hilfe der Image-Map
function fromDisplay(display: string, images: { alt: string; url: string }[]): string {
  let result = display
  // Ersetze jeden Platzhalter durch den entsprechenden Bild-Markdown
  // Wir matchen [📷 name] und schauen welches Bild dazu passt
  let imgIdx = 0
  result = result.replace(/\[📷\s+([^\]]+)\]/g, (_, name) => {
    // Suche das naechste Bild mit passendem Alt-Text
    const matched = images.find((img) => img.alt === name)
    if (matched) return `![${matched.alt}](${matched.url})`
    // Fallback: nimm das naechste verfuegbare Bild
    if (imgIdx < images.length) {
      const img = images[imgIdx++]
      return `![${img.alt}](${img.url})`
    }
    return ''
  })
  return result
}

function extractImages(md: string) {
  const imgs: { alt: string; url: string }[] = []
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    imgs.push({ alt: m[1], url: m[2] })
  }
  return imgs
}

export default function RichEditor({ value, onChange, placeholder, rows = 6, className = '' }: RichEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const images = extractImages(value)
  const displayValue = toDisplay(value)

  // Textarea-Aenderung: Platzhalter zurueck zu Markdown konvertieren
  function onDisplayChange(newDisplay: string) {
    onChange(fromDisplay(newDisplay, images))
  }

  function insertAtCursor(text: string) {
    const el = ref.current
    if (!el) {
      // Fallback: am Ende anhaengen
      onChange(value.trimEnd() + '\n' + text + '\n')
      return
    }
    const s = el.selectionStart
    const v = el.value
    const newDisplay = v.slice(0, s) + text + v.slice(s)
    onDisplayChange(newDisplay)
    requestAnimationFrame(() => {
      el.focus()
      const pos = s + text.length
      el.setSelectionRange(pos, pos)
    })
  }

  function addImage(alt: string, url: string) {
    // Erst das neue Bild zum Wert hinzufuegen (damit fromDisplay es kennt)
    // Dann den Platzhalter an der Cursorposition einfuegen
    const el = ref.current
    const placeholder = `[📷 ${alt || 'Bild'}]`

    if (el) {
      // Wir haben die neue Bildliste: vorhandene + neues Bild
      const newImages = [...images, { alt, url }]
      const s = el.selectionStart
      const currentDisplay = el.value
      const newDisplay = currentDisplay.slice(0, s) + placeholder + currentDisplay.slice(s)
      onChange(fromDisplay(newDisplay, newImages))
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(s + placeholder.length, s + placeholder.length)
      })
    } else {
      onChange(value.trimEnd() + `\n![${alt}](${url})\n`)
    }
  }

  function removeImage(url: string) {
    const esc = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    onChange(
      value
        .replace(new RegExp(`\\n?!\\[[^\\]]*\\]\\(${esc}\\)\\n?`, 'g'), '\n')
        .replace(/\n{3,}/g, '\n\n')
    )
  }

  function wrap(marker: string) {
    const el = ref.current
    if (!el) return
    const s = el.selectionStart
    const e = el.selectionEnd
    const txt = el.value
    const sel = txt.slice(s, e) || 'Text'
    const newDisplay = txt.slice(0, s) + marker + sel + marker + txt.slice(e)
    onDisplayChange(newDisplay)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + marker.length, s + marker.length + sel.length)
    })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('purpose', 'bio')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) addImage(file.name, data.url)
      else alert('Upload fehlgeschlagen.')
    } catch { alert('Upload fehlgeschlagen.') }
    finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleUrlImage() {
    const url = window.prompt('Bild-URL:')
    if (!url) return
    const alt = window.prompt('Beschreibung (optional):') ?? ''
    addImage(alt, url)
  }

  function handleYoutube() {
    const input = window.prompt('YouTube-URL oder Video-ID:')
    if (!input) return
    const m = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    insertAtCursor(`\n@youtube[${m ? m[1] : input.trim()}]\n`)
  }

  const btn = 'w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-xs flex-shrink-0'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap">
        <button type="button" onClick={() => wrap('**')} className={btn} title="Fett"><strong>B</strong></button>
        <button type="button" onClick={() => wrap('*')} className={btn + ' italic'} title="Kursiv">I</button>
        <div className="w-px h-5 bg-stone-200 mx-1" />
        <button type="button" onClick={handleUrlImage} className={btn} title="Bild-URL">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className={btn + (uploading ? ' opacity-50' : '')} title="Bild hochladen">
          {uploading
            ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button type="button" onClick={handleYoutube} className={btn} title="YouTube">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
        </button>
      </div>

      {/* Textarea: Bilder erscheinen als kompakte Platzhalter, keine URLs */}
      <textarea
        ref={ref}
        value={displayValue}
        onChange={(e) => onDisplayChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={className + ' resize-y'}
        style={{ minHeight: `${rows * 1.5}rem` }}
      />

      {/* Bild-Liste mit Vorschau */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-2 bg-cream border border-cream-deep rounded-lg px-2.5 py-1.5 text-xs text-stone-700">
              <img src={img.url} alt={img.alt} className="w-8 h-8 rounded object-cover flex-shrink-0" />
              <span className="truncate max-w-[120px]">{img.alt || 'Bild'}</span>
              <button type="button" onClick={() => removeImage(img.url)}
                className="text-stone-400 hover:text-red-500 ml-1 flex-shrink-0" title="Bild entfernen">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
