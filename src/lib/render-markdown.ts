/**
 * Einfacher Markdown→HTML Renderer für Artikel-Inhalte.
 * Unterstützt: Überschriften (H1-H4), Fett, Kursiv, Links, Bilder, Listen,
 * nummerierte Listen, Tabellen, Tipp/Info/Warnung/Fazit/Custom-Farbboxen,
 * Produkt-Karten, YouTube-Embeds, Blockquotes.
 */

export type ProductData = {
  asin: string
  name: string
  imageUrl: string | null
  description: string | null
  affiliateTag: string
  priceCents: number | null
  isAvailable: boolean
}

/** Extrahiert alle ASINs aus dem Markdown-Content */
export function extractAsins(md: string): string[] {
  const found: string[] = []
  const re = /:::produkt\[([A-Z0-9]{10})\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    if (!found.includes(m[1])) found.push(m[1])
  }
  return found
}

/**
 * Verarbeitet Markdown innerhalb von Boxen (Tipp, Info, Fazit, Custom).
 * Keine hardcoded Textfarben — alles erbt vom Parent-Container.
 */
function renderBoxContent(raw: string): string {
  let h = raw.trim()

  // Bullet-Zeichen: mitten im Text → eigene Zeile. Doppelte (- •) bereinigen
  h = h.replace(/(?<!^)(?<!\n)(\*?\*?[•●])/gm, '\n$1')
  h = h.replace(/^- [•●]\s*/gm, '- ')

  // Überschriften (ohne Farbklassen — erbt vom Box-Container)
  h = h.replace(/^#### (.+)$/gm, '<h4 class="font-serif text-lg font-bold mt-4 mb-1">$1</h4>')
  h = h.replace(/^### (.+)$/gm, '<h3 class="font-serif text-xl font-bold mt-5 mb-2">$1</h3>')
  h = h.replace(/^## (.+)$/gm, '<h2 class="font-serif text-2xl font-bold mt-6 mb-2">$1</h2>')

  // Inline
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline hover:opacity-80" target="_blank" rel="noopener">$1</a>')

  // Listen
  h = h.replace(/((?:^\d+\.\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^\d+\.\s/, ''))
    return '<ol class="list-decimal list-inside space-y-1 my-3 ml-4">' + items.map((i) => `<li>${i}</li>`).join('') + '</ol>'
  })
  h = h.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^- /, ''))
    return '<ul class="list-disc list-inside space-y-1 my-3 ml-4">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>'
  })

  // Absätze (ohne Farbklasse — erbt vom Parent, auch inline-HTML wird gewrappt)
  h = h.replace(/^(?!<(?:div|h[1-6]|p[ >]|ul|ol|li|table|tr|td|th|blockquote|hr|img|iframe|br))(.*\S.*)$/gm, '<p class="leading-relaxed mb-2">$1</p>')
  h = h.replace(/<p class="leading-relaxed mb-2"><\/p>/g, '')

  return h
}

export function renderMarkdown(md: string, products?: Map<string, ProductData>): string {
  let html = md

  // ── Bullet-Zeichen: mitten im Text → eigene Zeile. Doppelte (- •) bereinigen ──
  html = html.replace(/(?<!^)(?<!\n)(\*?\*?[•●])/gm, '\n$1')
  html = html.replace(/^- [•●]\s*/gm, '- ')

  // ── Produkt-Karten: :::produkt[ASIN] ──
  html = html.replace(/:::produkt\[([A-Z0-9]{10})\]/g, (_, asin) => {
    const p = products?.get(asin)
    if (!p) return `<p class="text-stone-400 text-sm my-4">[Produkt ${asin} nicht gefunden]</p>`
    if (!p.isAvailable) return ''

    const url = `https://www.amazon.de/dp/${p.asin}?tag=${p.affiliateTag}`
    const img = p.imageUrl
      ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-24 h-24 md:w-28 md:h-28 rounded-xl object-contain flex-shrink-0" />`
      : `<div class="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-cream flex items-center justify-center flex-shrink-0"><svg class="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>`
    const desc = p.description ? `<p class="text-stone-500 text-sm mt-1">${p.description}</p>` : ''

    return `<div class="my-6 bg-white border border-cream-deep rounded-2xl p-4 flex gap-4 items-center hover:shadow-sm transition-shadow"><a href="${url}" target="_blank" rel="noopener nofollow sponsored">${img}</a><div class="flex-1 min-w-0"><a href="${url}" target="_blank" rel="noopener nofollow sponsored" class="font-semibold text-stone-900 hover:text-forest transition-colors block">${p.name}</a>${desc}<a href="${url}" target="_blank" rel="noopener nofollow sponsored" class="inline-block mt-3 bg-honey text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-honey-light transition-colors">Bei Amazon ansehen →</a></div></div>`
  })

  // ── Tipp/Info/Warnung/Fazit/Custom-Boxen ──
  html = html.replace(/:::tipp\s+([\s\S]*?):::/g, (_, content) =>
    `<div class="bg-green-50 border-l-4 border-green-500 rounded-r-xl px-5 py-4 my-6"><p class="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">💡 Tipp</p><div class="text-stone-700 text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  )
  html = html.replace(/:::info\s+([\s\S]*?):::/g, (_, content) =>
    `<div class="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl px-5 py-4 my-6"><p class="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">ℹ️ Info</p><div class="text-stone-700 text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  )
  html = html.replace(/:::warnung\s+([\s\S]*?):::/g, (_, content) =>
    `<div class="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-5 py-4 my-6"><p class="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">⚠️ Achtung</p><div class="text-stone-700 text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  )
  html = html.replace(/:::fazit\s+([\s\S]*?):::/g, (_, content) =>
    `<div class="bg-forest rounded-2xl px-6 py-5 my-8 shadow-sm"><p class="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">✍️ Fazit der Redaktion</p><div class="text-white/90 text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  )

  // ── Custom Farbbox: :::box[#hex] ... ::: ──
  html = html.replace(/:::box\[([^\]]+)\]\s+([\s\S]*?):::/g, (_, color, content) => {
    const c = color.trim()
    const hex = c.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) || 0
    const g = parseInt(hex.substring(2, 4), 16) || 0
    const b = parseInt(hex.substring(4, 6), 16) || 0
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const textClass = luminance > 0.55 ? 'text-stone-800' : 'text-white/90'
    return `<div class="rounded-2xl px-6 py-5 my-6 ${textClass}" style="background-color:${c}"><div class="text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  })

  // ── YouTube-Embeds: @youtube[VIDEO_ID] ──
  html = html.replace(/@youtube\[([a-zA-Z0-9_-]{11})\]/g,
    '<div class="aspect-video rounded-xl overflow-hidden my-6"><iframe src="https://www.youtube-nocookie.com/embed/$1" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
  )

  // ── Tabellen: | col | col | ──
  html = html.replace(/((?:^\|[^\n]+\|$\n?)+)/gm, (table) => {
    const rows = table.trim().split('\n').filter((r) => r.trim())
    if (rows.length < 2) return table
    const isHeader = rows[1]?.match(/^\|[\s-:|]+\|$/)
    let out = '<div class="overflow-x-auto my-10"><table class="w-full text-sm border-collapse rounded-xl overflow-hidden">'
    rows.forEach((row, i) => {
      if (i === 1 && isHeader) return
      const cells = row.split('|').filter((c, ci, arr) => ci > 0 && ci < arr.length - 1)
      const tag = i === 0 && isHeader ? 'th' : 'td'
      const cellClass = i === 0 && isHeader
        ? 'bg-forest/10 text-stone-800 font-semibold text-left px-4 py-2.5'
        : 'border-t border-cream-deep px-4 py-2.5 text-stone-600'
      out += '<tr>' + cells.map((c) => `<${tag} class="${cellClass}">${c.trim()}</${tag}>`).join('') + '</tr>'
    })
    out += '</table></div>'
    return out
  })

  // ── Blockquotes: > text ──
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-stone-300 pl-4 py-1 my-4 text-stone-500 italic">$1</blockquote>')

  // ── Überschriften ──
  html = html.replace(/^#### (.+)$/gm, '<h4 class="font-serif text-lg font-bold text-stone-900 mt-6 mb-2">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-serif text-xl font-bold text-stone-900 mt-8 mb-3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-serif text-3xl font-bold text-stone-900 mt-10 mb-4">$1</h1>')

  // ── Inline-Formatierung ──
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // ── Bilder ──
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-6 w-full" />')

  // ── Links ──
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-forest underline hover:text-forest-light" target="_blank" rel="noopener">$1</a>')

  // ── Nummerierte Listen: 1. item ──
  html = html.replace(/((?:^\d+\.\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^\d+\.\s/, ''))
    return '<ol class="list-decimal list-inside space-y-1 my-4 ml-4 text-stone-700">' + items.map((i) => `<li>${i}</li>`).join('') + '</ol>'
  })

  // ── Aufzählungslisten: - item ──
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^- /, ''))
    return '<ul class="list-disc list-inside space-y-1 my-4 ml-4 text-stone-700">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>'
  })

  // ── Horizontale Linie: --- ──
  html = html.replace(/^\s*---\s*$/gm, '<hr class="border-cream-deep my-8" />')

  // ── Absätze (Zeilen die kein Block-Level-HTML sind → auch <strong>, <em>, <a> werden gewrappt) ──
  html = html.replace(/^(?!<(?:div|h[1-6]|p[ >]|ul|ol|li|table|tr|td|th|blockquote|hr|img|iframe|br))(.*\S.*)$/gm, '<p class="text-stone-700 leading-relaxed mb-2">$1</p>')
  html = html.replace(/<p class="text-stone-700 leading-relaxed mb-2"><\/p>/g, '')

  return html
}
