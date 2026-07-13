'use client'

import { useRef, useState } from 'react'

type RichEditorProps = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

function toDisplay(md: string): string {
  return md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt) => `[📷 ${alt || 'Bild'}]`)
}

function fromDisplay(display: string, images: { alt: string; url: string }[]): string {
  let result = display
  let imgIdx = 0
  result = result.replace(/\[📷\s+([^\]]+)\]/g, (_, name) => {
    const matched = images.find((img) => img.alt === name)
    if (matched) return `![${matched.alt}](${matched.url})`
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
  const [showEmoji, setShowEmoji] = useState(false)

  const images = extractImages(value)
  const displayValue = toDisplay(value)

  function onDisplayChange(newDisplay: string) {
    onChange(fromDisplay(newDisplay, images))
  }

  function insertAtCursor(text: string) {
    const el = ref.current
    if (!el) { onChange(value.trimEnd() + '\n' + text + '\n'); return }
    const s = el.selectionStart
    const v = el.value
    const newDisplay = v.slice(0, s) + text + v.slice(s)
    onDisplayChange(newDisplay)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + text.length, s + text.length) })
  }

  function insertEmoji(emoji: string) {
    const el = ref.current
    if (el) {
      const s = el.selectionStart
      const newDisplay = el.value.slice(0, s) + emoji + el.value.slice(s)
      onDisplayChange(newDisplay)
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + emoji.length, s + emoji.length) })
    } else {
      onDisplayChange(displayValue + emoji)
    }
  }

  function wrap(marker: string) {
    const el = ref.current
    if (!el) return
    const s = el.selectionStart
    const e = el.selectionEnd
    const sel = el.value.slice(s, e) || 'Text'
    const newDisplay = el.value.slice(0, s) + marker + sel + marker + el.value.slice(e)
    onDisplayChange(newDisplay)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + marker.length, s + marker.length + sel.length) })
  }

  function prefixLines(prefix: string) {
    const el = ref.current
    if (!el) return
    const s = el.selectionStart
    const e = el.selectionEnd
    const v = el.value
    const lineStart = v.lastIndexOf('\n', s - 1) + 1
    const lineEnd = v.indexOf('\n', e)
    const selectedLines = v.slice(lineStart, lineEnd === -1 ? v.length : lineEnd)
    const prefixed = selectedLines.split('\n').map((l) => prefix + l).join('\n')
    const newDisplay = v.slice(0, lineStart) + prefixed + v.slice(lineEnd === -1 ? v.length : lineEnd)
    onDisplayChange(newDisplay)
  }

  function insertLink() {
    const el = ref.current
    const selectedText = el ? el.value.slice(el.selectionStart, el.selectionEnd) : ''
    const text = selectedText || window.prompt('Linktext:') || 'Link'
    const url = window.prompt('URL:')
    if (!url) return
    const md = `[${text}](${url})`
    if (el && selectedText) {
      const s = el.selectionStart
      const newDisplay = el.value.slice(0, s) + md + el.value.slice(el.selectionEnd)
      onDisplayChange(newDisplay)
    } else {
      insertAtCursor(md)
    }
  }

  function insertQuote() {
    insertAtCursor('\n:::tipp\nHier steht ein hilfreicher Tipp oder Hinweis.\n:::\n')
  }

  function insertTable() {
    insertAtCursor('\n| Spalte 1 | Spalte 2 | Spalte 3 |\n|----------|----------|----------|\n| Zelle 1  | Zelle 2  | Zelle 3  |\n| Zelle 4  | Zelle 5  | Zelle 6  |\n')
  }

  function addImage(alt: string, url: string) {
    const el = ref.current
    const ph = `[📷 ${alt || 'Bild'}]`
    if (el) {
      const newImages = [...images, { alt, url }]
      const s = el.selectionStart
      const newDisplay = el.value.slice(0, s) + ph + el.value.slice(s)
      onChange(fromDisplay(newDisplay, newImages))
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + ph.length, s + ph.length) })
    } else {
      onChange(value.trimEnd() + `\n![${alt}](${url})\n`)
    }
  }

  function removeImage(url: string) {
    const esc = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    onChange(value.replace(new RegExp(`\\n?!\\[[^\\]]*\\]\\(${esc}\\)\\n?`, 'g'), '\n').replace(/\n{3,}/g, '\n\n'))
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
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  function handleYoutube() {
    const input = window.prompt('YouTube-URL oder Video-ID:')
    if (!input) return
    const m = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    insertAtCursor(`\n@youtube[${m ? m[1] : input.trim()}]\n`)
  }

  const btn = 'w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-xs flex-shrink-0'
  const sep = <div className="w-px h-5 bg-stone-200 mx-0.5" />

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap bg-cream/50 rounded-xl p-1.5">
        {/* Text-Formatierung */}
        <button type="button" onClick={() => wrap('**')} className={btn} title="Fett"><strong>B</strong></button>
        <button type="button" onClick={() => wrap('*')} className={btn + ' italic'} title="Kursiv">I</button>
        {sep}
        {/* Überschriften */}
        <button type="button" onClick={() => insertAtCursor('\n## ')} className={btn} title="Überschrift groß"><span className="font-bold text-[10px]">H2</span></button>
        <button type="button" onClick={() => insertAtCursor('\n### ')} className={btn} title="Überschrift mittel"><span className="font-bold text-[10px]">H3</span></button>
        <button type="button" onClick={() => insertAtCursor('\n#### ')} className={btn} title="Überschrift klein"><span className="font-bold text-[9px]">H4</span></button>
        {sep}
        {/* Listen */}
        <button type="button" onClick={() => prefixLines('- ')} className={btn} title="Aufzählung">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <button type="button" onClick={() => prefixLines('1. ')} className={btn} title="Nummerierte Liste">
          <span className="text-[10px] font-bold">1.</span>
        </button>
        <button type="button" onClick={() => prefixLines('   ')} className={btn} title="Einrücken">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
        </button>
        {sep}
        {/* Links & Medien */}
        <button type="button" onClick={insertLink} className={btn} title="Link einfügen">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={btn + (uploading ? ' opacity-50' : '')} title="Bild hochladen">
          {uploading
            ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button type="button" onClick={handleYoutube} className={btn} title="YouTube">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
        </button>
        {sep}
        {/* Spezialblöcke */}
        <button type="button" onClick={insertQuote} className={btn} title="Tipp-Box">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        </button>
        <button type="button" onClick={() => insertAtCursor('\n:::info\nHier steht eine Information.\n:::\n')} className={btn} title="Info-Box">
          <span className="text-blue-500 text-[10px] font-bold">ℹ</span>
        </button>
        <button type="button" onClick={() => insertAtCursor('\n:::warnung\nHier steht eine Warnung.\n:::\n')} className={btn} title="Warnung-Box">
          <span className="text-amber-500 text-[10px] font-bold">⚠</span>
        </button>
        <button type="button" onClick={() => insertAtCursor('\n:::fazit\nHier steht das Fazit der Redaktion.\n:::\n')} className={btn} title="Fazit der Redaktion">
          <span className="text-[10px] font-bold text-forest">✍</span>
        </button>
        <button type="button" onClick={() => {
          const color = window.prompt('Hintergrundfarbe (Hex, z.B. #f0e6d3):')
          if (color && /^#[0-9a-fA-F]{6}$/.test(color.trim())) insertAtCursor(`\n:::box[${color.trim()}]\nText in farbiger Box.\n:::\n`)
          else if (color) alert('Bitte gültigen Hex-Wert eingeben (z.B. #f0e6d3).')
        }} className={btn} title="Farbige Box">
          <span className="text-[10px] font-bold">🎨</span>
        </button>
        <button type="button" onClick={insertTable} className={btn} title="Tabelle">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"/></svg>
        </button>
        <button type="button" onClick={() => prefixLines('> ')} className={btn} title="Zitat">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        </button>
        <button type="button" onClick={() => insertAtCursor('\n---\n')} className={btn} title="Trennlinie">
          <span className="text-stone-400 text-[10px]">—</span>
        </button>
        <button type="button" onClick={() => {
          const asin = window.prompt('Amazon ASIN eingeben (10 Zeichen):')
          if (asin && /^[A-Z0-9]{10}$/.test(asin.trim())) insertAtCursor(`\n:::produkt[${asin.trim()}]\n`)
          else if (asin) alert('Ungültige ASIN. Muss 10 Zeichen (A-Z, 0-9) sein.')
        }} className={btn} title="Amazon-Produkt einfügen">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        </button>
        {sep}
        <div className="relative">
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={btn} title="Emoji">😊</button>
          {showEmoji && (
            <div className="absolute top-10 left-0 z-50 bg-white border border-stone-200 rounded-xl shadow-lg p-2 grid grid-cols-8 gap-1 w-64">
              {['😀','😂','🥰','😍','🐕','🐾','🐶','🦮','🐩','🐕‍🦺','❤️','🎉','✨','🌟','💪','👏','🙏','✅','🔥','💯','🌿','🍀','🌸','🌺','📸','📅','🏆','🎖️','💉','🩺','📋','🔬'].map((e) => (
                <button key={e} type="button" onClick={() => { insertEmoji(e); setShowEmoji(false) }}
                  className="text-lg hover:bg-cream rounded p-1 transition-colors">{e}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <textarea
        ref={ref}
        value={displayValue}
        onChange={(e) => onDisplayChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={className + ' resize-y'}
        style={{ minHeight: `${rows * 1.5}rem` }}
      />

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
